const admin = require('firebase-admin')

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp()
}

const { generateScript } = require('./src/generateScript')
const { generateImage } = require('./src/generateImage')
const { generateVideo } = require('./src/generateVideo')
const { checkTaskStatus } = require('./src/checkTaskStatus')
const { exportZip } = require('./src/exportZip')

exports.generateScript = generateScript
exports.generateImage = generateImage
exports.generateVideo = generateVideo
exports.checkTaskStatus = checkTaskStatus
exports.exportZip = exportZip
