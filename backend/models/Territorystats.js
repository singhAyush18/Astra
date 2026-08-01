const mongoose = require("mongoose");

const territoryStatsSchema = new mongoose.Schema({

    territoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Territory",
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    points: {
        type: Number,
        default: 0
    },

    totalDistance: {
        type: Number,
        default: 0
    },

    totalRuns: {
        type: Number,
        default: 0
    },

    averagePace: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "TerritoryStats",
    territoryStatsSchema
);