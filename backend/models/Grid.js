const mongoose = require("mongoose");

const gridSchema = new mongoose.Schema({
    gridId: {
        type: String,
        unique: true,
        required: true
    },

    ruler: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    status: {
    type: String,
    enum: ["unclaimed", "claimed"],
    default: "unclaimed"
    },
    
    center: {
        lat: Number,
        lng: Number
    },

    claimedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports =
    mongoose.models.Grid ||
    mongoose.model("Grid", gridSchema);