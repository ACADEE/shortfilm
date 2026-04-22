const admin = require('firebase-admin')

const db = admin.firestore()

/**
 * Verifies that userId owns the given projectId.
 * Sends 404/403 and returns false if not; returns true if ownership confirmed.
 */
async function verifyProjectOwner(projectId, userId, res) {
  const snap = await db.collection('projects').doc(projectId).get()
  if (!snap.exists) {
    res.status(404).json({ error: 'Project not found' })
    return false
  }
  if (snap.data().userId !== userId) {
    res.status(403).json({ error: 'Forbidden' })
    return false
  }
  return true
}

module.exports = { verifyProjectOwner }
