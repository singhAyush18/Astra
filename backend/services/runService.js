const Grid = require("../models/Grid");
const GridInfluence = require("../models/Gridinfluence");
const User = require("../models/User");
const { calculateXP, updateStreak } = require("../controllers/gamificationController");
const { getGridIdFromCoordinates, addInfluenceToGrid } = require("./Gridservices");

/**
 * Calculate pace in minutes and format as string (e.g., "5:30 min/km")
 */
const calculatePace = (distanceKm, durationSeconds) => {
    const paceInMinutes = distanceKm > 0 ? durationSeconds / 60 / distanceKm : 0;
    const mins = Math.floor(paceInMinutes);
    const secs = Math.round((paceInMinutes - mins) * 60);
    const paceString = `${mins}:${secs.toString().padStart(2, "0")} min/km`;
    return { paceInMinutes, paceString };
};

/**
 * Process GPS coordinates across territorial grids, assign influence, and fetch territory ruler info.
 */
const processRunGrids = async (run, user) => {
    if (!run.path || run.path.length === 0) {
        return { gridBreakdown: [], lastGridSummary: null };
    }

    // Count GPS points per grid to distribute XP / influence proportionally
    const gridPointCounts = {};
    for (const point of run.path) {
        const gId = getGridIdFromCoordinates(point.lat, point.lng);
        gridPointCounts[gId] = (gridPointCounts[gId] || 0) + 1;
    }

    const totalPoints = run.path.length;
    const uniqueGridIds = Object.keys(gridPointCounts);
    const gridBreakdown = [];

    for (const gId of uniqueGridIds) {
        const proportion = gridPointCounts[gId] / totalPoints;
        const gridDistance = run.distance * proportion;
        const gridInfluence = Math.round(gridDistance * 100);

        await addInfluenceToGrid(gId, user._id, gridInfluence, gridDistance);
        gridBreakdown.push({
            gridId: gId,
            influenceEarned: gridInfluence,
            distance: gridDistance,
        });
    }

    run.gridBreakdown = gridBreakdown;

    // Fetch summary for the last territory touched in the path
    const lastPoint = run.path[run.path.length - 1];
    const lastGridId = getGridIdFromCoordinates(lastPoint.lat, lastPoint.lng);
    const gridDoc = await Grid.findOne({ gridId: lastGridId });

    let gridInfluenceDoc = null;
    let gridRulerName = null;

    if (gridDoc) {
        gridInfluenceDoc = await GridInfluence.findOne({
            gridId: gridDoc._id,
            userId: user._id,
        });

        if (gridDoc.ruler) {
            const rulerUser = await User.findById(gridDoc.ruler);
            gridRulerName = rulerUser ? rulerUser.username : null;
        }
    }

    const lastGridSummary = gridInfluenceDoc
        ? {
              gridId: lastGridId,
              influenceAdded: 0, // Assigned in completeRun with xpEarned
              totalInfluence: gridInfluenceDoc.influence,
              totalDistance: gridInfluenceDoc.totalDistance,
              totalRuns: gridInfluenceDoc.totalRuns,
              claimed: !!gridDoc?.ruler,
              rulerId: gridDoc?.ruler || null,
              rulerName: gridRulerName,
          }
        : null;

    return { gridBreakdown, lastGridSummary };
};

/**
 * Encapsulates the complete run lifecycle:
 * - Computes duration & pace
 * - Discards short runs (< 100m)
 * - Awards XP & levels up user
 * - Updates running streaks
 * - Distributes grid territory influence
 */
const completeRun = async (run, options = {}) => {
    const { duration: frontendDuration, user: providedUser } = options;

    run.endTime = run.endTime || new Date();
    run.duration =
        frontendDuration !== undefined
            ? frontendDuration
            : run.duration || Math.floor((run.endTime - run.startTime) / 1000);

    const { paceInMinutes, paceString } = calculatePace(run.distance, run.duration);
    run.pace = paceString;

    // Short run threshold (< 100 meters)
    if (run.distance < 0.1) {
        run.status = "discarded";
        await run.save();
        return {
            status: "discarded",
            run,
            xpEarned: 0,
            streakInfo: null,
            level: providedUser?.level || 1,
            gridSummary: null,
        };
    }

    run.status = "completed";

    let xpEarned = 0;
    let streakInfo = null;
    let gridSummary = null;

    const user = providedUser || (await User.findById(run.userId));

    if (user) {
        xpEarned = calculateXP(run.distance, paceInMinutes);
        user.xp = (user.xp || 0) + xpEarned;
        user.level = Math.floor(user.xp / 500) + 1;
        await user.save();

        streakInfo = await updateStreak(user._id);

        const { lastGridSummary } = await processRunGrids(run, user);
        if (lastGridSummary) {
            lastGridSummary.influenceAdded = xpEarned;
            gridSummary = lastGridSummary;
        }
    }

    await run.save();

    return {
        status: "completed",
        run,
        user,
        xpEarned,
        streakInfo,
        level: user?.level || 1,
        gridSummary,
    };
};

module.exports = {
    calculatePace,
    processRunGrids,
    completeRun,
};
