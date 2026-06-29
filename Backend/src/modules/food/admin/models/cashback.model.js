import mongoose from 'mongoose';

const cashbackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  customer: {
    type: String, // could be "All" or a specific user ID
    default: "All",
  },
  cashbackType: {
    type: String,
    enum: ['Percentage', 'Amount'],
    required: true,
  },
  cashbackAmount: {
    type: Number,
    required: true,
  },
  minPurchase: {
    type: Number,
    required: true,
  },
  maxDiscount: {
    type: Number,
    default: 0, // 0 means no limit if it's percentage, or N/A if it's fixed amount
  },
  startDate: {
    type: String,
    required: true,
  },
  endDate: {
    type: String,
    required: true,
  },
  limitForSameUser: {
    type: Number,
    default: 1,
  },
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export default mongoose.model('Cashback', cashbackSchema);
