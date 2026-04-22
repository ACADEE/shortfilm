const functions = require('firebase-functions')
const admin = require('firebase-admin')
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args))
const { getStorage } = require('firebase-admin/storage')
const corsMiddleware = require('./cors')
const { verifyToken } = require('./authMiddleware')

const KIE_STATUS_URL = 'https://api.kie.ai/api/v1/jobs/getTaskDetail'

const db = admin.firestore()

async function downloadAndUpload(url, storagePath) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`)
  const buffer = await response.buffer()

  const bucket = getStorage().bucket()
  const file = bucket.file(storagePath)
  await file.save(buffer, { public: true })

  return `https://storage.googleapis.com/${bucket.name}/${storagePath}`
}

async function checkTaskStatusHandler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).send('')

  const userId = await verifyToken(req, res)
  if (!userId) return

  const { taskId, projectId, itemType, itemId, epId, planId } = req.body
  if (!taskId || !projectId || !itemType) {
    return res.status(400).json({ error: 'taskId, projectId, itemType required' })
  }

  const apiKey = functions.config().kieai?.key || process.env.KIE_API_KEY

  try {
    const response = await fetch(`${KIE_STATUS_URL}?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const data = await response.json()

    if (data.code !== 200) throw new Error(data.msg || 'kie.ai status error')

    const taskData = data.data
    const status = taskData?.status

    // Map kie.ai statuses to our statuses
    if (status === 'completed' || status === 'succeed' || status === 'SUCCESS') {
      // Find the output URL
      const outputUrl =
        taskData?.output?.url ||
        taskData?.output?.[0]?.url ||
        taskData?.outputUrl ||
        taskData?.resultUrls?.[0]

      if (!outputUrl) {
        return res.json({ status: 'processing' })
      }

      if (itemType === 'image' && itemId) {
        const colName = req.body.colName === 'locations' ? 'locations' : 'characters'
        const ext = 'jpg'
        const storagePath = `projects/${userId}/${projectId}/images/${itemId}.${ext}`
        const publicUrl = await downloadAndUpload(outputUrl, storagePath)

        await db
          .collection('projects')
          .doc(projectId)
          .collection(colName)
          .doc(itemId)
          .update({ reference_image_url: publicUrl, status: 'ready' })

        return res.json({ status: 'ready', url: publicUrl })
      }

      if (itemType === 'video' && planId && epId) {
        const storagePath = `projects/${userId}/${projectId}/videos/${planId}.mp4`
        const publicUrl = await downloadAndUpload(outputUrl, storagePath)

        await db
          .collection('projects')
          .doc(projectId)
          .collection('episodes')
          .doc(epId)
          .collection('plans')
          .doc(planId)
          .update({ mp4_url: publicUrl, status: 'ready' })

        return res.json({ status: 'ready', url: publicUrl })
      }
    }

    if (status === 'failed' || status === 'FAILED' || status === 'error') {
      if (itemType === 'image' && itemId) {
        const colName = req.body.colName === 'locations' ? 'locations' : 'characters'
        await db
          .collection('projects').doc(projectId)
          .collection(colName).doc(itemId)
          .update({ status: 'error' })
      }
      if (itemType === 'video' && planId && epId) {
        await db
          .collection('projects').doc(projectId)
          .collection('episodes').doc(epId)
          .collection('plans').doc(planId)
          .update({ status: 'error' })
      }
      return res.json({ status: 'error' })
    }

    // Still processing — update Firestore status
    if (itemType === 'image' && itemId) {
      const colName = req.body.colName === 'locations' ? 'locations' : 'characters'
      await db
        .collection('projects').doc(projectId)
        .collection(colName).doc(itemId)
        .update({ status: 'processing' })
    }
    if (itemType === 'video' && planId && epId) {
      await db
        .collection('projects').doc(projectId)
        .collection('episodes').doc(epId)
        .collection('plans').doc(planId)
        .update({ status: 'processing' })
    }

    return res.json({ status: 'processing' })
  } catch (err) {
    console.error('checkTaskStatus error:', err)
    return res.status(500).json({ error: err.message })
  }
}

exports.checkTaskStatus = functions.https.onRequest((req, res) => {
  corsMiddleware(req, res, () => checkTaskStatusHandler(req, res))
})
