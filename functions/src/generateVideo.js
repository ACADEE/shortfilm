const functions = require('firebase-functions')
const admin = require('firebase-admin')
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args))
const corsMiddleware = require('./cors')
const { verifyToken } = require('./authMiddleware')

const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs/createTask'

const db = admin.firestore()

async function generateVideoHandler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).send('')

  const userId = await verifyToken(req, res)
  if (!userId) return

  const { videoMotionPrompt, imagePromptOverride, referenceImageUrl, planId, epId, projectId } = req.body
  if (!videoMotionPrompt || !planId || !epId || !projectId) {
    return res.status(400).json({ error: 'videoMotionPrompt, planId, epId, projectId required' })
  }

  const apiKey = functions.config().kieai?.key || process.env.KIE_API_KEY

  try {
    const body = {
      model: 'bytedance/seedance-2',
      input: {
        prompt: `${imagePromptOverride || ''} ${videoMotionPrompt}`.trim(),
        aspect_ratio: '9:16',
        duration: 5,
        resolution: '720p',
        generate_audio: false,
      },
    }

    // Add reference image as first frame if available
    if (referenceImageUrl) {
      body.input.first_frame_url = referenceImageUrl
    }

    const response = await fetch(KIE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    if (data.code !== 200) throw new Error(data.msg || 'kie.ai error')

    const taskId = data.data.taskId

    // Update plan in Firestore
    await db
      .collection('projects')
      .doc(projectId)
      .collection('episodes')
      .doc(epId)
      .collection('plans')
      .doc(planId)
      .update({ kie_task_id: taskId, status: 'queued' })

    return res.json({ taskId })
  } catch (err) {
    console.error('generateVideo error:', err)
    return res.status(500).json({ error: err.message })
  }
}

exports.generateVideo = functions.https.onRequest((req, res) => {
  corsMiddleware(req, res, () => generateVideoHandler(req, res))
})
