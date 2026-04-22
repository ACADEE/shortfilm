const functions = require('firebase-functions')
const admin = require('firebase-admin')
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args))
const { getStorage } = require('firebase-admin/storage')
const archiver = require('archiver')
const corsMiddleware = require('./cors')
const { verifyToken } = require('./authMiddleware')
const { verifyProjectOwner } = require('./ownershipMiddleware')

const db = admin.firestore()

async function exportZipHandler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).send('')

  const userId = await verifyToken(req, res)
  if (!userId) return

  const { projectId, epId } = req.body
  if (!projectId || !epId) {
    return res.status(400).json({ error: 'projectId and epId required' })
  }

  if (!(await verifyProjectOwner(projectId, userId, res))) return

  try {
    // Query all ready plans ordered by plan_number
    const plansSnap = await db
      .collection('projects')
      .doc(projectId)
      .collection('episodes')
      .doc(epId)
      .collection('plans')
      .where('status', '==', 'ready')
      .orderBy('plan_number')
      .get()

    if (plansSnap.empty) {
      return res.status(400).json({ error: 'No ready plans found' })
    }

    const bucket = getStorage().bucket()
    const zipPath = `projects/${userId}/${projectId}/exports/${epId}.zip`
    const zipFile = bucket.file(zipPath)

    await new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 6 } })
      const writeStream = zipFile.createWriteStream({ contentType: 'application/zip' })

      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
      archive.on('error', reject)
      archive.pipe(writeStream)

      const appendPromises = plansSnap.docs.map(async (docSnap) => {
        const plan = docSnap.data()
        if (!plan.mp4_url) return
        try {
          const response = await fetch(plan.mp4_url)
          const planName = `plan_${String(plan.plan_number).padStart(2, '0')}.mp4`
          archive.append(response.body, { name: planName })
        } catch (e) {
          console.warn(`Failed to append plan ${plan.plan_number}:`, e.message)
        }
      })

      Promise.all(appendPromises).then(() => archive.finalize()).catch(reject)
    })

    // Generate signed URL (1 hour)
    const [signedUrl] = await zipFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000,
    })

    return res.json({ zipUrl: signedUrl })
  } catch (err) {
    console.error('exportZip error:', err)
    return res.status(500).json({ error: err.message })
  }
}

exports.exportZip = functions
  .runWith({ timeoutSeconds: 300, memory: '1GB' })
  .https.onRequest((req, res) => {
    corsMiddleware(req, res, () => exportZipHandler(req, res))
  })
