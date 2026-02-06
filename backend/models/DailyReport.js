import mongoose from 'mongoose';

const dailyReportSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
  },
  openingBalance: {
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
  deposited: {
    type: Number,
    required: true,
    default: 0,
  },
  qty: {
    type: Number,
    required: true,
    default: 0,
  },
  note: {
    type: String,
    default: "",
    trim: true,
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
  closingBalance: {
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
  this.closingBalance = this.totalSale - this.expense - this.deposited;
  this.net = this.totalSale - this.expense;
});

const DailyReport = mongoose.model('DailyReport', dailyReportSchema);

export default DailyReport;
