const mongoose = require("mongoose");

const runSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ["active", "completed", "discarded"],
    default: "active"
  },
  duration: {
    type: Number,
    default: 0
  },
  pace: {
    type: String,
    default: "0:00 min/km"
  },
  distance: {
    type: Number,
    default: 0
  },
  path: [{
    _id: false,
    lat: {
      type: Number,
      required: true
    },

    lng: {
      type: Number,
      required: true
    }
  }],
  gridBreakdown: [{
    _id: false,
    gridId: String,
    influenceEarned: Number,
    distance: Number
  }],
  antiCheat: {
    isFlagged: {
      type: Boolean,
      default: false
    },
    reasons: [String],
    flags: [String],
    maxCalculatedSpeedKmh: Number,
    avgCalculatedSpeedKmh: Number
  },
  isSimulated: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

runSchema.index({ userId: 1, status: 1 });
runSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Run", runSchema);