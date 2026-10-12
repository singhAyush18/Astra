const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            required: true,
            enum: [
                "territory_attacked",
                "territory_usurped",
                "streak_danger",
                "absence_dormancy",
                "system",
            ],
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        data: {
            gridId: { type: String, default: null },
            territoryName: { type: String, default: null },
            rivalName: { type: String, default: null },
            rivalId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
            streak: { type: Number, default: 0 },
            influence: { type: Number, default: 0 },
            actionUrl: { type: String, default: null },
        },
        read: {
            type: Boolean,
            default: false,
            index: true,
        },
        emailSent: {
            type: Boolean,
            default: false,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            index: true,
            expires: 60 * 60 * 24 * 30, // Auto-delete older than 30 days
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient user notifications query
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
