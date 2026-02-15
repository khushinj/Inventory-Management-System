import mongoose from 'mongoose';

const onlineDailyReportSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
  },
  // Platform Quantities
  myntraQty: {
    type: Number,
    required: true,
    default: 0,
  },
  ajioQty: {
    type: Number,
    required: true,
    default: 0,
  },
  amazonQty: {
    type: Number,
    required: true,
    default: 0,
  },
  flipkartQty: {
    type: Number,
    required: true,
    default: 0,
  },
  snapdealQty: {
    type: Number,
    required: true,
    default: 0,
  },
  websiteQty: {
    type: Number,
    required: true,
    default: 0,
  },
  totalQuantity: {
    type: Number,
    required: true,
    default: 0,
  },
  // Platform Prices
  myntraPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  ajioPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  amazonPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  flipkartPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  snapdealPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  websitePrice: {
    type: Number,
    required: true,
    default: 0,
  },
  // Financial Details
  totalSale: {
    type: Number,
    required: true,
    default: 0,
  },
  totalReturns: {
    type: Number,
    required: true,
    default: 0,
  },
  amountReceived: {
    type: Number,
    required: true,
    default: 0,
  },
}, {
  timestamps: true,
});

// Calculate totals before saving
onlineDailyReportSchema.pre('save', function() {
  // Calculate total quantity from all platforms
  this.totalQuantity = this.myntraQty + this.ajioQty + this.amazonQty + 
                       this.flipkartQty + this.snapdealQty + this.websiteQty;
  
  // Calculate total sale from all platform prices
  this.totalSale = this.myntraPrice + this.ajioPrice + this.amazonPrice + 
                   this.flipkartPrice + this.snapdealPrice + this.websitePrice;
});

const OnlineDailyReport = mongoose.model('OnlineDailyReport', onlineDailyReportSchema);

export default OnlineDailyReport;
