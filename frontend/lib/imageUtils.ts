/**
 * Check if a string is a base64 encoded image
 */
export const isBase64Image = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('data:image/');
};

/**
 * Check if a string is a Cloudinary URL or any HTTP URL
 */
export const isImageUrl = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('http://') || str.startsWith('https://');
};

/**
 * Get the appropriate image source for Next.js Image component
 * Handles both base64 images and URLs (Cloudinary or others)
 */
export const getImageSource = (imageStr: string | undefined): string | null => {
  if (!imageStr) return null;
  
  // If it's already a base64 image or URL, return as is
  if (isBase64Image(imageStr) || isImageUrl(imageStr)) {
    return imageStr;
  }
  
  return null;
};

/**
 * Validate if an image string is valid for display
 */
export const isValidImageSource = (imageStr: string | undefined): boolean => {
  if (!imageStr) return false;
  return isBase64Image(imageStr) || isImageUrl(imageStr);
};
