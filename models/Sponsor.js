const mongoose = require('mongoose');

const sponsorSchema = new mongoose.Schema(
  {
    name: String,
    logo: String,
    url: String,
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sponsor', sponsorSchema);
