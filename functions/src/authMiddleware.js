const admin = require('firebase-admin')

async function verifyToken(req, res) {
  const { authorization } = req.headers
  if (!authorization || !authorization.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  try {
    const token = authorization.split('Bearer ')[1]
    const decoded = await admin.auth().verifyIdToken(token)
    return decoded.uid
  } catch {
    res.status(401).json({ error: 'Invalid token' })
    return null
  }
}

module.exports = { verifyToken }
