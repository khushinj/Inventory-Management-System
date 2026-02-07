import cloudinary from '../config/cloudinary.js';

/**
 * Upload an image to Cloudinary
 * @param {string} filePath - Local file path or base64 string
 * @param {string} folder - Folder name in Cloudinary (default: 'jobcards')
 * @returns {Promise<{url: string, publicId: string}>} - Cloudinary URL and public ID
 */
export const uploadToCloudinary = async (filePath, folder = 'jobcards') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - Cloudinary public ID of the image
 * @returns {Promise<void>}
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

/**
 * Extract Cloudinary public ID from URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null
 */
export const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // Get everything after /upload/v{version}/
    const pathParts = parts.slice(uploadIndex + 2);
    const publicIdWithExt = pathParts.join('/');
    
    // Remove file extension
    const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

/**
 * Check if a string is a base64 encoded image
 * @param {string} str - String to check
 * @returns {boolean}
 */
export const isBase64Image = (str) => {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('data:image/');
};

/**
 * Check if a string is a Cloudinary URL
 * @param {string} str - String to check
 * @returns {boolean}
 */
export const isCloudinaryUrl = (str) => {
  if (!str || typeof str !== 'string') return false;
  return str.includes('cloudinary.com');
};
