import shopInventoryService from '../services/shopInventory.service.js';

class ShopInventoryController {
  // Calculate and update shop inventory
  async calculateInventory(req, res) {
    try {
      const result = await shopInventoryService.calculateInventory();
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          totalRecords: result.totalRecords
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to calculate inventory',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in calculateInventory:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get shop inventory with optional filters
  async getInventory(req, res) {
    try {
      const filters = {
        designNumber: req.query.designNumber,
        color: req.query.color,
        size: req.query.size,
        hideZeroStock: req.query.hideZeroStock
      };

      const result = await shopInventoryService.getInventory(filters);
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
          totalRecords: result.totalRecords
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to get inventory',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in getInventory:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get inventory grouped by design number and color
  async getInventoryGrouped(req, res) {
    try {
      const { designNumber } = req.params;
      
      if (!designNumber) {
        return res.status(400).json({
          success: false,
          message: 'Design number is required'
        });
      }

      const result = await shopInventoryService.getInventoryGrouped(designNumber);
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          designNumber: result.designNumber,
          data: result.data,
          totalColors: result.totalColors
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to get grouped inventory',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in getInventoryGrouped:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

export default new ShopInventoryController();
