import shopInventoryService from '../services/shopInventory.service.js';

/**
 * Middleware to automatically recalculate shop inventory after transactions
 * This ensures the shop inventory is always up-to-date
 */
export const autoRecalculateInventory = async (req, res, next) => {
  // Store the original json method
  const originalJson = res.json;

  // Override the json method
  res.json = function (data) {
    // Call the original json method first
    originalJson.call(this, data);

    // Then trigger inventory recalculation in the background
    // Only if the request was successful (status 200 or 201)
    if (res.statusCode === 200 || res.statusCode === 201) {
      shopInventoryService
        .calculateInventory()
        .then((result) => {
          if (result.success) {
            console.log(
              `✅ Shop inventory auto-recalculated: ${result.totalRecords} records`
            );
          } else {
            console.error('❌ Failed to auto-recalculate inventory:', result.error);
          }
        })
        .catch((err) => {
          console.error('❌ Error during auto-recalculation:', err);
        });
    }
  };

  next();
};
