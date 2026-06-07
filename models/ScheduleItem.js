const mongoose = require('mongoose');

const scheduleItemSchema = new mongoose.Schema(
  {
    day: { type: Number, min: 1, max: 5 },
    date: String,
    artistName: String,
    startTime: String,
    stage: String,
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ScheduleItem', scheduleItemSchema);
