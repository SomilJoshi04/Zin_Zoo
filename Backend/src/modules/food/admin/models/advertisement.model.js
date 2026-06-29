import mongoose from 'mongoose';

const advertisementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  shortDescription: {
    type: String,
  },
  restaurant: {
    type: String,
  },
  priority: {
    type: String,
    default: "Priority",
  },
  advertisementType: {
    type: String,
    default: "Restaurant Promotion",
  },
  validity: {
    type: String,
  },
  showReview: {
    type: Boolean,
    default: true,
  },
  showRatings: {
    type: Boolean,
    default: true,
  },
  profileImage: {
    type: String, // URL or base64
  },
  coverImage: {
    type: String, // URL or base64
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  isPaused: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default mongoose.model('Advertisement', advertisementSchema);
