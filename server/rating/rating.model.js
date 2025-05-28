const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Host', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    charges: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

ratingSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Rating', ratingSchema);
