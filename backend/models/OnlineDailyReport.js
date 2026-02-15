import mongoose from 'mongoose';

const onlineDailyReportSchema = new mongoose.Schema({
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
onlineDailyReportSchema.pre('save', function() {
  this.totalSale = this.cashSale + this.upi + this.creditCard + this.creditNote;
  this.closingBalance = this.openingBalance + this.cashSale - this.expense - this.deposited;
  this.net = this.openingBalance + this.totalSale - this.expense - this.deposited;
});

const OnlineDailyReport = mongoose.model('OnlineDailyReport', onlineDailyReportSchema);

export default OnlineDailyReport;
