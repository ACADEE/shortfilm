const functions = require('firebase-functions')
const admin = require('firebase-admin')
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args))
const corsMiddleware = require('./cors')
const { verifyToken } = require('./authMiddleware')

const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs/createTask'

const db = admin.firestore()

async function generateImageHandler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).send('')

  const userId = await verifyToken(req, res)
  if (!userId) return

  const { imagePrompt, itemId, itemType, projectId } = req.body
  if (!imagePrompt || !itemId || !itemType || !projectId) {
    return res.status(400).json({ error: 'imagePrompt, itemId, itemType, projectId required' })
  }

  const apiKey = functions.config().kieai?.key || process.env.KIE_API_KEY

  try {
    const response = await fetch(KIE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'nano-banana-2',
        input: {
          prompt: imagePrompt,
          aspect_ratio: '9:16',
          resolution: '1K',
          output_format: 'jpg',
        },
      }),
    })

    const data = await response.json()
    if (data.code !== 200) throw new Error(data.msg || 'kie.ai error')

    const taskId = data.data.taskId

    // Update Firestore with task ID
    const colName = itemType === 'character' ? 'characters' : 'locations'
    await db
      .collection('projects')
      .doc(projectId)
      .collection(colName)
      .doc(itemId)
      .update({ kie_task_id: taskId, status: 'queued' })

    return res.json({ taskId })
  } catch (err) {
    console.error('generateImage error:', err)
    return res.status(500).json({ error: err.message })
  }
}

exports.generateImage = functions.https.onRequest((req, res) => {
  corsMiddleware(req, res, () => generateImageHandler(req, res))
})
