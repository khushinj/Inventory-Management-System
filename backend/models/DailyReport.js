import mongoose from 'mongoose';

const dailyReportSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
  },
  cashInHand: {
    type: Number,
    required: true,
    default: 0,
  },
  cashSale: {
    type: Number,
    required: true,
    default: 0,
  },
  upi: {
    type: Number,
    required: true,
    default: 0,
  },
  creditCard: {
    type: Number,
    required: true,
    default: 0,
  },
  creditNote: {
    type: Number,
    required: true,
    default: 0,
  },
  totalSale: {
    type: Number,
    required: true,
    default: 0,
  },
  expense: {
    type: Number,
    required: true,
    default: 0,
  },
  net: {
    type: Number,
    required: true,
    default: 0,
  },
}, {
  timestamps: true,
});

// Calculate total sale before saving
dailyReportSchema.pre('save', function() {
  this.totalSale = this.cashSale + this.upi + this.creditCard + this.creditNote;
  this.net = this.totalSale - this.expense;
});

const DailyReport = mongoose.model('DailyReport', dailyReportSchema);

export default DailyReport;
