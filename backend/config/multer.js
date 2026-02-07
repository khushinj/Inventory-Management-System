import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'inventory-management', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'], // Allowed file formats
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }], // Optional: resize images
  },
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  // Accept images and PDFs only
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

export default upload;
