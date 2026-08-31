const mongoose = require("mongoose");

const gridInfluenceSchema = new mongoose.Schema({
    gridId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Grid",
        required: true
    },

    gridCode: {
        type: String,
        default: null
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    influence: {
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
    }
}, {
    timestamps: true
});

gridInfluenceSchema.index(
    { gridId: 1, userId: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "GridInfluence",
    gridInfluenceSchema
);