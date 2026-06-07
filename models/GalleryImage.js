const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema(
  {
    image: String,
    caption: String,
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GalleryImage', galleryImageSchema);
