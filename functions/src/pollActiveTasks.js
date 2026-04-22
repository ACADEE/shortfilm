const functions = require('firebase-functions')
const admin = require('firebase-admin')
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args))
const { getStorage } = require('firebase-admin/storage')

const KIE_STATUS_URL = 'https://api.kie.ai/api/v1/jobs/getTaskDetail'

const db = admin.firestore()

async function downloadAndUpload(url, storagePath) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed: ${response.statusText}`)
  const buffer = await response.buffer()
  const bucket = getStorage().bucket()
  const file = bucket.file(storagePath)
  await file.save(buffer, { public: true })
  return `https://storage.googleapis.com/${bucket.name}/${storagePath}`
}

async function pollPlan(planDoc, apiKey) {
  const data = planDoc.data()
  const { kie_task_id, owner_id, status: currentStatus } = data

  if (!kie_task_id || !owner_id) return

  // projects/{projectId}/episodes/{epId}/plans/{planId}
  const parts = planDoc.ref.path.split('/')
  const projectId = parts[1]
  const epId = parts[3]
  const planId = parts[5]

  const response = await fetch(`${KIE_STATUS_URL}?taskId=${kie_task_id}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  const result = await response.json()
  if (result.code !== 200) throw new Error(result.msg || 'kie.ai error')

  const taskData = result.data
  const kieStatus = taskData?.status

  const planRef = planDoc.ref

  if (kieStatus === 'completed' || kieStatus === 'succeed' || kieStatus === 'SUCCESS') {
    const outputUrl =
      taskData?.output?.url ||
      taskData?.output?.[0]?.url ||
      taskData?.outputUrl ||
      taskData?.resultUrls?.[0]

    if (!outputUrl) return

    const storagePath = `projects/${owner_id}/${projectId}/videos/${planId}.mp4`
    const publicUrl = await downloadAndUpload(outputUrl, storagePath)
    await planRef.update({ mp4_url: publicUrl, status: 'ready' })
    return
  }

  if (kieStatus === 'failed' || kieStatus === 'FAILED' || kieStatus === 'error') {
    await planRef.update({ status: 'error' })
    return
  }

  if (currentStatus !== 'processing') {
    await planRef.update({ status: 'processing' })
  }
}

exports.pollActiveTasks = functions.pubsub.schedule('every 1 minutes').onRun(async () => {
  const apiKey = functions.config().kieai?.key || process.env.KIE_API_KEY
  if (!apiKey) {
    console.error('pollActiveTasks: KIE_API_KEY not configured')
    return
  }

  const snapshot = await db
    .collectionGroup('plans')
    .where('status', 'in', ['queued', 'processing'])
    .get()

  if (snapshot.empty) return

  await Promise.allSettled(
    snapshot.docs.map((doc) =>
      pollPlan(doc, apiKey).catch((err) =>
        console.error(`pollActiveTasks: error for plan ${doc.ref.path}:`, err.message)
      )
    )
  )
})
