import multer from "multer";
import path from "path";
import fs from "fs";
import { Express } from "express";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * Configure and set up file upload routes for the application
 */
export function setupFileUploadRoutes(app: Express) {
  // Get current file path and directory
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDir = dirname(currentFilePath);
  
  // Set up upload directory
  const uploadDirectory = path.join(currentDir, '../public/uploads');
  
  // Ensure upload directory exists
  if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
  }
  
  // Configure multer storage
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDirectory);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    },
  });
  
  // Create upload middleware with limits and filtering
  const upload = multer({ 
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Only allow images
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed') as any);
      }
    }
  });
  
  // API endpoint for file uploads
  app.post('/api/upload-media', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Return the file path that can be accessed from the client
      const filePath = `/uploads/${req.file.filename}`;
      res.json({
        success: true,
        url: filePath,
        message: 'File uploaded successfully',
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading file',
      });
    }
  });
}