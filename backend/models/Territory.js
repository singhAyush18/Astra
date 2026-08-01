const mongoose = require("mongoose");
const territorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },

    type: {
        type: String,
        enum: ["hotspot", "kingdom"],
        required: true
    },

    ruler: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    founder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    center: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }
    },

    radius: {
        type: Number,
        required: true
    },

    totalConquests: {
        type: Number,
        default: 0
    },

    influence: {
        type: Number,
        default: 0
    },

    lastConqueredAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Territory", territorySchema);