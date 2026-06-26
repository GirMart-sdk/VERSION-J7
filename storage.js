const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Ensure the uploads directory exists.
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * @route   POST /api/storage/upload
 * @desc    Uploads an image from a Base64 string
 * @access  Private (should be protected by auth middleware)
 */
router.post('/upload', (req, res) => {
  try {
    const { base64Data, fileName } = req.body;

    if (!base64Data || !fileName) {
      return res.status(400).json({ error: 'Faltan datos de imagen o nombre de archivo.' });
    }

    // Extract content type and data from Base64 string
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Formato de datos Base64 inválido.' });
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');
    
    // Sanitize filename and create a unique name
    const safeFileName = path.basename(fileName).replace(/[^a-z0-9_.-]/gi, '_');
    const uniqueFileName = `${Date.now()}-${safeFileName}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFileName);

    fs.writeFileSync(filePath, imageBuffer);

    // Construct the public URL to return to the client
    // This assumes your server serves the 'uploads' directory statically.
    const publicUrl = `/uploads/${uniqueFileName}`;

    res.status(200).json({ success: true, publicUrl: publicUrl });

  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar la imagen.' });
  }
});

module.exports = router;