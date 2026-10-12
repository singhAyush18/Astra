const Notification = require("../models/Notification");
const User = require("../models/User");
const Grid = require("../models/Grid");
const {
    sendTerritoryAttackedEmail,
    sendTerritoryUsurpedEmail,
    sendStreakDangerEmail,
    sendAbsenceWarningEmail,
} = require("./emailService");

/**
 * Notify territory ruler that a rival has run through their territory and gained influence.
 * Throttled: At most 1 alert per 4 hours per grid to prevent email/inbox spam.
 */
async function notifyTerritoryAttacked({ grid, rulerId, rivalUser, xpEarned }) {
    try {
        if (!grid || !rulerId || !rivalUser) return;

        let rival = rivalUser;
        if (!rival.username) {
            rival = await User.findById(rival._id || rival);
        }
        if (!rival) return;
        if (rulerId.toString() === rival._id.toString()) return; // Don't notify yourself

        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
        const existingRecent = await Notification.findOne({
            userId: rulerId,
            type: "territory_attacked",
            "data.gridId": grid.gridId,
            createdAt: { $gte: fourHoursAgo },
        });

        if (existingRecent) {
            return; // Throttled to prevent flooding
        }

        const ruler = await User.findById(rulerId);
        if (!ruler) return;

        const territoryName = grid.name || `Sector ${grid.gridId}`;
        const rivalName = rivalUser.username || "A rival runner";

        // 1. Create In-App Notification
        const notification = await Notification.create({
            userId: ruler._id,
            type: "territory_attacked",
            title: "⚔️ Territory Under Siege!",
            message: `${rivalName} marched through your territory '${territoryName}' and gained +${xpEarned} influence! Defend your realm!`,
            data: {
                gridId: grid.gridId,
                territoryName,
                rivalName,
                rivalId: rivalUser._id,
                influence: xpEarned,
                actionUrl: "/territories",
            },
        });

        // 2. Dispatch Email Alert asynchronously
        if (ruler.email) {
            sendTerritoryAttackedEmail(
                ruler.email,
                ruler.username,
                territoryName,
                rivalName,
                xpEarned
            ).then((success) => {
                if (success) {
                    notification.emailSent = true;
                    notification.save().catch(() => {});
                }
            }).catch((err) => console.error("Email send error (attack):", err));
        }

        return notification;
    } catch (err) {
        console.error("notifyTerritoryAttacked error:", err);
    }
}

/**
 * Notify previous ruler that their territory was usurped and crown lost.
 */
async function notifyTerritoryUsurped({ grid, previousRulerId, newRulerUser }) {
    try {
        if (!grid || !previousRulerId || !newRulerUser) return;

        let rival = newRulerUser;
        if (!rival.username) {
            rival = await User.findById(rival._id || rival);
        }
        if (!rival) return;
        if (previousRulerId.toString() === rival._id.toString()) return;

        const previousRuler = await User.findById(previousRulerId);
        if (!previousRuler) return;

        const territoryName = grid.name || `Sector ${grid.gridId}`;
        const rivalName = rival.username || "A rival warlord";

        // 1. Create In-App Notification
        const notification = await Notification.create({
            userId: previousRuler._id,
            type: "territory_usurped",
            title: `👑 Crown Usurped: ${territoryName}`,
            message: `${rivalName} surpassed your influence and claimed dominion over '${territoryName}'! Reclaim your throne!`,
            data: {
                gridId: grid.gridId,
                territoryName,
                rivalName,
                rivalId: rival._id,
                actionUrl: "/territories",
            },
        });

        // 2. Dispatch Email Alert asynchronously
        if (previousRuler.email) {
            sendTerritoryUsurpedEmail(
                previousRuler.email,
                previousRuler.username,
                territoryName,
                rivalName
            ).then((success) => {
                if (success) {
                    notification.emailSent = true;
                    notification.save().catch(() => {});
                }
            }).catch((err) => console.error("Email send error (usurp):", err));
        }

        return notification;
    } catch (err) {
        console.error("notifyTerritoryUsurped error:", err);
    }
}

/**
 * Check absence and streak danger across all users:
 * 1. Daily Streak Danger: Sent if user has an active streak (>0), hasn't run today, and it is evening (>= 18:00 local/server time).
 * 2. 3-Day Dormancy: Sent if user has been inactive for 3+ days (throttled to once every 7 days).
 */
async function checkAbsenceAndStreakDanger() {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const currentHour = new Date().getHours();
        const isEvening = currentHour >= 18; // 6 PM or later

        // 1. Check active streak runners
        if (isEvening) {
            const streakUsers = await User.find({
                currentStreak: { $gt: 0 },
                $or: [
                    { lastRunDate: { $lt: todayStart } },
                    { lastRunDate: null },
                ],
            });

            for (const user of streakUsers) {
                // Check if streak danger notification was already sent today
                const alreadySentToday = await Notification.findOne({
                    userId: user._id,
                    type: "streak_danger",
                    createdAt: { $gte: todayStart },
                });

                if (!alreadySentToday) {
                    const notif = await Notification.create({
                        userId: user._id,
                        type: "streak_danger",
                        title: "🔥 Streak at Risk!",
                        message: `Your ${user.currentStreak}-day running streak is about to break at midnight! Log a run today to keep the flame alive.`,
                        data: {
                            streak: user.currentStreak,
                            actionUrl: "/run",
                        },
                    });

                    if (user.email) {
                        sendStreakDangerEmail(user.email, user.username, user.currentStreak)
                            .then((ok) => {
                                if (ok) {
                                    notif.emailSent = true;
                                    notif.save().catch(() => {});
                                }
                            })
                            .catch(() => {});
                    }
                }
            }
        }

        // 2. Check 3-Day Inactivity / Dormancy
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const dormantUsers = await User.find({
            $or: [
                { lastRunDate: { $lte: threeDaysAgo } },
                { lastRunDate: null, createdAt: { $lte: threeDaysAgo } },
            ],
        });

        for (const user of dormantUsers) {
            // Check if dormancy alert was sent within the last 7 days to avoid spam
            const recentlySent = await Notification.findOne({
                userId: user._id,
                type: "absence_dormancy",
                createdAt: { $gte: sevenDaysAgo },
            });

            if (!recentlySent) {
                const daysInactive = user.lastRunDate
                    ? Math.floor((Date.now() - new Date(user.lastRunDate)) / (1000 * 60 * 60 * 24))
                    : 3;

                const notif = await Notification.create({
                    userId: user._id,
                    type: "absence_dormancy",
                    title: "🏰 The Realm Awaits Your Return!",
                    message: `You haven't marched in ${daysInactive} days! Rival warlords are expanding while your kingdom sits dormant. Lace up and reclaim the roads!`,
                    data: {
                        actionUrl: "/run",
                    },
                });

                if (user.email) {
                    sendAbsenceWarningEmail(user.email, user.username, daysInactive)
                        .then((ok) => {
                            if (ok) {
                                notif.emailSent = true;
                                notif.save().catch(() => {});
                            }
                        })
                        .catch(() => {});
                }
            }
        }
    } catch (err) {
        console.error("checkAbsenceAndStreakDanger error:", err);
    }
}

module.exports = {
    notifyTerritoryAttacked,
    notifyTerritoryUsurped,
    checkAbsenceAndStreakDanger,
};
