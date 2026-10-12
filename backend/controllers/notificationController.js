const Notification = require("../models/Notification");

/**
 * Get user's notifications (paginated + unread count)
 */
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 30));
        const unreadOnly = req.query.unreadOnly === "true";

        const query = { userId };
        if (unreadOnly) {
            query.read = false;
        }

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Notification.countDocuments(query),
            Notification.countDocuments({ userId, read: false }),
        ]);

        return res.status(200).json({
            notifications,
            total,
            unreadCount,
            page,
            totalPages: Math.ceil(total / limit) || 1,
        });
    } catch (err) {
        console.error("getNotifications error:", err);
        return res.status(500).json({ message: "Failed to retrieve notifications" });
    }
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const notification = await Notification.findOne({ _id: id, userId });
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        notification.read = true;
        await notification.save();

        const unreadCount = await Notification.countDocuments({ userId, read: false });

        return res.status(200).json({
            notification,
            unreadCount,
        });
    } catch (err) {
        console.error("markAsRead error:", err);
        return res.status(500).json({ message: "Failed to mark notification as read" });
    }
};

/**
 * Mark all notifications as read for current user
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await Notification.updateMany(
            { userId, read: false },
            { $set: { read: true } }
        );

        return res.status(200).json({
            message: "All notifications marked as read",
            modifiedCount: result.modifiedCount,
            unreadCount: 0,
        });
    } catch (err) {
        console.error("markAllAsRead error:", err);
        return res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await Notification.findOneAndDelete({ _id: id, userId });
        if (!result) {
            return res.status(404).json({ message: "Notification not found" });
        }

        const unreadCount = await Notification.countDocuments({ userId, read: false });

        return res.status(200).json({
            message: "Notification deleted",
            unreadCount,
        });
    } catch (err) {
        console.error("deleteNotification error:", err);
        return res.status(500).json({ message: "Failed to delete notification" });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
