/**
 * Design Number Normalization Utility
 * Provides consistent normalization of design numbers across the system
 * This ensures "NGW - 351236 A" and "NGW-351236A" are treated as the same
 */

/**
 * Normalize design number by:
 * - Removing all whitespace
 * - Converting to uppercase
 * - Trimming edges
 * - Handling special cases (e.g., "aaw-" to "aw-")
 */
export const normalizeDesignNumber = (dno) => {
  if (!dno) return '';
  
  let normalized = String(dno)
    .trim() // Remove leading/trailing spaces
    .replace(/\s+/g, '') // Remove ALL internal spaces
    .toUpperCase(); // Normalize case
  
  // Handle special case: remove duplicated prefixes like "AAW-" -> "AW-"
  if (normalized.startsWith('AAW-')) {
    normalized = normalized.substring(1); // Remove first 'A'
  }
  
  return normalized;
};

/**
 * Normalize color by:
 * - Trimming whitespace
 * - Converting to uppercase
 * - Normalizing multiple spaces to single space
 */
export const normalizeColor = (color) => {
  if (!color) return '';
  return String(color)
    .trim()
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .toUpperCase();
};

/**
 * Normalize size by:
 * - Trimming whitespace
 * - Converting to uppercase
 */
export const normalizeSize = (size) => {
  if (!size) return '';
  return String(size)
    .trim()
    .toUpperCase();
};

/**
 * Create a composite key for grouping inventory items
 * This ensures items with same design, color, size are grouped together
 */
export const createInventoryKey = (dno, color = '', size = '') => {
  const normalizedDno = normalizeDesignNumber(dno);
  const normalizedColor = normalizeColor(color);
  const normalizedSize = normalizeSize(size);
  
  return `${normalizedDno}|${normalizedColor}|${normalizedSize}`;
};

/**
 * Validate if a design number is valid
 */
export const isValidDesignNumber = (dno) => {
  const normalized = normalizeDesignNumber(dno);
  return normalized.length > 0;
};

export default {
  normalizeDesignNumber,
  normalizeColor,
  normalizeSize,
  createInventoryKey,
  isValidDesignNumber
};
