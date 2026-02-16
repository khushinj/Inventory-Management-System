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
  // Platform Returns
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
  // Amount Received per Platform
  myntraAmountReceived: {
    type: Number,
    required: true,
    default: 0,
  },
  ajioAmountReceived: {
    type: Number,
    required: true,
    default: 0,
  },
  amazonAmountReceived: {
    type: Number,
    required: true,
    default: 0,
  },
  flipkartAmountReceived: {
    type: Number,
    required: true,
    default: 0,
  },
  snapdealAmountReceived: {
    type: Number,
    required: true,
    default: 0,
  },
  websiteAmountReceived: {
    type: Number,
    required: true,
    default: 0,
  },
  // Legacy Financial Details (kept for backwards compatibility)
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
  
  // Calculate total sale from all platform amounts received
  this.totalSale = this.myntraAmountReceived + this.ajioAmountReceived + this.amazonAmountReceived + 
                   this.flipkartAmountReceived + this.snapdealAmountReceived + this.websiteAmountReceived;
  
  // Calculate total returns
  this.totalReturns = this.myntraPrice + this.ajioPrice + this.amazonPrice + 
                      this.flipkartPrice + this.snapdealPrice + this.websitePrice;
  
  // Calculate amount received (total sale - total returns)
  this.amountReceived = this.totalSale - this.totalReturns;
});

const OnlineDailyReport = mongoose.model('OnlineDailyReport', onlineDailyReportSchema);

export default OnlineDailyReport;
