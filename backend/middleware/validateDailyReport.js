// Validation middleware for daily report
export const validateDailyReport = (req, res, next) => {
  const { date, cashSale, upi, creditCard, creditNote, expense, qty, note, deposited } = req.body;

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
    cashSale,
    upi,
    creditCard,
    creditNote,
    expense,
    qty,
    deposited,
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
  req.body.cashSale = Number(cashSale) || 0;
  req.body.upi = Number(upi) || 0;
  req.body.creditCard = Number(creditCard) || 0;
  req.body.creditNote = Number(creditNote) || 0;
  req.body.expense = Number(expense) || 0;
  req.body.qty = Number(qty) || 0;
  req.body.deposited = Number(deposited) || 0;
  req.body.note = typeof note === 'string' ? note.trim() : '';

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
