const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    features: [
      {
        text: String,
        included: { type: Boolean, default: true },
      },
    ],
    highlighted: { type: Boolean, default: false },
    buyUrl: String,
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);
