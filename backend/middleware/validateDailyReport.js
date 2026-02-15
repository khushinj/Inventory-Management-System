// Validation middleware for daily report
export const validateDailyReport = (req, res, next) => {
  const { 
    date, 
    myntraQty, ajioQty, amazonQty, flipkartQty, snapdealQty, websiteQty,
    myntraPrice, ajioPrice, amazonPrice, flipkartPrice, snapdealPrice, websitePrice,
    totalReturns, amountReceived 
  } = req.body;

  console.log('🔍 Middleware received:', req.body);

  // Validate date
  if (!date) {
    return res.status(400).json({
      message: 'Date is required',
      field: 'date',
    });
  }

  const reportDate = new Date(date);
  if (isNaN(reportDate.getTime())) {
    return res.status(400).json({
      message: 'Invalid date format',
      field: 'date',
    });
  }

  // Validate numeric fields (they should be numbers and >= 0)
  const numericFields = {
    myntraQty,
    ajioQty,
    amazonQty,
    flipkartQty,
    snapdealQty,
    websiteQty,
    myntraPrice,
    ajioPrice,
    amazonPrice,
    flipkartPrice,
    snapdealPrice,
    websitePrice,
    totalReturns,
    amountReceived,
  };

  for (const [field, value] of Object.entries(numericFields)) {
    if (value !== undefined && value !== null) {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return res.status(400).json({
          message: `${field} must be a valid number`,
          field,
        });
      }
      if (numValue < 0) {
        return res.status(400).json({
          message: `${field} cannot be negative`,
          field,
        });
      }
    }
  }

  // Sanitize and set defaults for numeric fields
  req.body.myntraQty = Number(myntraQty) || 0;
  req.body.ajioQty = Number(ajioQty) || 0;
  req.body.amazonQty = Number(amazonQty) || 0;
  req.body.flipkartQty = Number(flipkartQty) || 0;
  req.body.snapdealQty = Number(snapdealQty) || 0;
  req.body.websiteQty = Number(websiteQty) || 0;
  req.body.myntraPrice = Number(myntraPrice) || 0;
  req.body.ajioPrice = Number(ajioPrice) || 0;
  req.body.amazonPrice = Number(amazonPrice) || 0;
  req.body.flipkartPrice = Number(flipkartPrice) || 0;
  req.body.snapdealPrice = Number(snapdealPrice) || 0;
  req.body.websitePrice = Number(websitePrice) || 0;
  req.body.totalReturns = Number(totalReturns) || 0;
  req.body.amountReceived = Number(amountReceived) || 0;

  console.log('✅ Middleware validated and sanitized:', req.body);

  next();
};

// Validate date parameter
export const validateDateParam = (req, res, next) => {
  const { date } = req.params;

  if (!date) {
    return res.status(400).json({
      message: 'Date parameter is required',
    });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({
      message: 'Invalid date format in parameter',
    });
  }

  next();
};

// Validate date range query parameters
export const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      message: 'Both startDate and endDate are required',
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return res.status(400).json({
      message: 'Invalid startDate format',
    });
  }

  if (isNaN(end.getTime())) {
    return res.status(400).json({
      message: 'Invalid endDate format',
    });
  }

  if (start > end) {
    return res.status(400).json({
      message: 'startDate cannot be after endDate',
    });
  }

  next();
};

// Validate month and year parameters
export const validateMonthYear = (req, res, next) => {
  const { year, month } = req.params;

  const yearNum = parseInt(year);
  const monthNum = parseInt(month);

  if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
    return res.status(400).json({
      message: 'Invalid year. Must be between 2000 and 2100',
    });
  }

  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res.status(400).json({
      message: 'Invalid month. Must be between 1 and 12',
    });
  }

  req.params.year = yearNum;
  req.params.month = monthNum;

  next();
};
