const cors = require('cors')

// Allowed origins: production Firebase hosting + local dev
// Set APP_ORIGIN env var (comma-separated) to override
const PRODUCTION_ORIGINS = [
  'https://duan-ju-generator.web.app',
  'https://duan-ju-generator.firebaseapp.com',
]

const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']

function getAllowedOrigins() {
  const envOrigins = process.env.APP_ORIGIN
  if (envOrigins) return envOrigins.split(',').map((s) => s.trim())
  return [...PRODUCTION_ORIGINS, ...DEV_ORIGINS]
}

module.exports = cors({
  origin: (origin, callback) => {
    // Allow server-to-server calls (no origin header) and Firebase emulators
    if (!origin) return callback(null, true)
    if (getAllowedOrigins().includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
})
