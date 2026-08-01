const Run = require("../models/Run");
const User = require("../models/User");

const updateStreak = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!user.lastRunDate) {
        user.currentStreak = 1;
    } else {
        const lastRunDate = new Date(user.lastRunDate);
        lastRunDate.setHours(0, 0, 0, 0);

        const diffTime = today - lastRunDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            user.currentStreak += 1;
        } else if (diffDays > 1) {
            user.currentStreak = 1;
        }
        // diffDays === 0 → same day → no change
    }

    user.lastRunDate = today;
    user.longestStreak = Math.max(user.longestStreak, user.currentStreak);

    await user.save();

    return {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
    };
}; 
    function calculateXP(distance, paceInMinPerKm) {
    // Base XP: 10 XP per km
    let xp = distance * 10;

    // Bonus: 50 XP for every 5 km completed
    xp += Math.floor(distance / 5) * 50;

    // Intensity Multiplier
    let multiplier = 1;

    if (paceInMinPerKm <= 4) {
        multiplier = 1.3;      // Elite pace
    } else if (paceInMinPerKm <= 5) {
        multiplier = 1.2;      // High intensity
    } else if (paceInMinPerKm <= 6) {
        multiplier = 1.1;      // Moderate intensity
    }

    xp *= multiplier;

    return Math.round(xp);
}


module.exports = {
    calculateXP,
    updateStreak
};

