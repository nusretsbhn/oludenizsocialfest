const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: String,
    image: String,
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Artist', artistSchema);
