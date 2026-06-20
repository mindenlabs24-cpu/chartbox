const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer to use Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine resource type based on file mimetype
    let resource_type = 'auto';
    if (file.mimetype.startsWith('video/')) {
      resource_type = 'video';
    } else if (file.mimetype.startsWith('audio/')) {
      resource_type = 'video'; // Cloudinary uses 'video' for audio files as well
    } else if (file.mimetype.startsWith('image/')) {
      resource_type = 'image';
    }

    return {
      folder: 'chartbox_uploads',
      resource_type: resource_type,
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'mp3', 'wav', 'ogg', 'webm']
    };
  },
});

const upload = multer({ storage: storage });

// Upload Endpoint
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Hakuna faili lililopokelewa' });
    }
    
    // Determine internal media type for frontend rendering
    let mediaType = 'unknown';
    if (req.file.mimetype.startsWith('image/')) mediaType = 'image';
    if (req.file.mimetype.startsWith('video/')) mediaType = 'video';
    if (req.file.mimetype.startsWith('audio/')) mediaType = 'audio';

    res.status(200).json({
      message: 'Faili limepakiwa kikamilifu',
      url: req.file.path,
      mediaType: mediaType,
      public_id: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Hitilafu imetokea wakati wa kupakia faili' });
  }
});

module.exports = router;
