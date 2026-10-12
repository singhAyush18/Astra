const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} = require("../controllers/notificationController");

// All notification routes are protected
router.get("/", auth, getNotifications);
router.put("/mark-all-read", auth, markAllAsRead);
router.put("/:id/read", auth, markAsRead);
router.delete("/:id", auth, deleteNotification);

module.exports = router;
