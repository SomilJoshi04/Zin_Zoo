import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  campaignType: {
    type: String,
    enum: ['basic', 'food'],
    required: true,
  },
  dateStart: {
    type: String,
    required: true,
  },
  dateEnd: {
    type: String,
    required: true,
  },
  timeStart: {
    type: String,
    required: true,
  },
  timeEnd: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    default: 0, // only for food campaigns
  },
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export default mongoose.model('Campaign', campaignSchema);
