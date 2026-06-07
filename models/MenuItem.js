const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
    order: { type: Number, default: 0 },
    isCta: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);
