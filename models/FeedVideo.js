const mongoose = require('mongoose');

const feedVideoSchema = new mongoose.Schema(
  {
    video: String,
    caption: String,
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FeedVideo', feedVideoSchema);
