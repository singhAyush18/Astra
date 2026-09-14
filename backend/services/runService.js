const Grid = require("../models/Grid");
const GridInfluence = require("../models/Gridinfluence");
const User = require("../models/User");
const { calculateXP, updateStreak } = require("../controllers/gamificationController");
const { getGridIdFromCoordinates, addInfluenceToGrid } = require("./Gridservices");
const { validateRunIntegrity } = require("./antiCheatService");

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
    const conquestMap = {};

    for (const gId of uniqueGridIds) {
        const proportion = gridPointCounts[gId] / totalPoints;
        const gridDistance = run.distance * proportion;
        const gridInfluence = Math.round(gridDistance * 100);

        const { conquestResult } = await addInfluenceToGrid(gId, user._id, gridInfluence, gridDistance);
        if (conquestResult) {
            conquestMap[gId] = conquestResult;
        }

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
    let rivalRulerName = null;

    const lastConquest = conquestMap[lastGridId];
    const conquestType = lastConquest?.conquestType || "none";
    const isUsurped = conquestType === "usurp";

    if (gridDoc) {
        gridInfluenceDoc = await GridInfluence.findOne({
            gridId: gridDoc._id,
            userId: user._id,
        });

        if (gridDoc.ruler) {
            const rulerUser = await User.findById(gridDoc.ruler);
            gridRulerName = rulerUser ? rulerUser.username : null;
        }

        // If a rival was dethroned in this run, fetch that previous rival's name
        if (isUsurped && lastConquest?.previousRuler) {
            const prevUser = await User.findById(lastConquest.previousRuler);
            rivalRulerName = prevUser ? prevUser.username : "Rival Ruler";
        }
    }

    const lastGridSummary = gridInfluenceDoc
        ? {
              gridId: lastGridId,
              conquestType, // 'claim' | 'usurp' | 'reinforced' | 'none'
              influenceAdded: 0, // Assigned in completeRun with xpEarned
              totalInfluence: gridInfluenceDoc.influence,
              totalDistance: gridInfluenceDoc.totalDistance,
              totalRuns: gridInfluenceDoc.totalRuns,
              claimed: conquestType === "claim" || conquestType === "usurp" || conquestType === "reinforced",
              isUsurped,
              rulerId: gridDoc?.ruler || null,
              rulerName: gridRulerName, // Current ruler (e.g. user)
              rivalName: rivalRulerName, // Dethroned rival (if usurp), never current user
          }
        : null;

    return { gridBreakdown, lastGridSummary };
};

/**
 * Encapsulates the complete run lifecycle:
 * - Anti-cheat verification
 * - Computes duration & pace
 * - Discards short runs (< 100m)
 * - Awards XP & levels up user
 * - Updates running streaks
 * - Distributes grid territory influence
 */
const completeRun = async (run, options = {}) => {
    const { duration: frontendDuration, user: providedUser, isSimulated } = options;

    run.endTime = run.endTime || new Date();
    run.duration =
        frontendDuration !== undefined
            ? frontendDuration
            : run.duration || Math.floor((run.endTime - run.startTime) / 1000);

    if (isSimulated !== undefined) {
        run.isSimulated = Boolean(isSimulated);
    }

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
            antiCheat: run.antiCheat || { isFlagged: false },
        };
    }

    // Perform Anti-Cheat & Kinematic Feasibility Analysis
    const integrityResult = validateRunIntegrity(run, run.duration);
    run.antiCheat = {
        isFlagged: integrityResult.isFlagged,
        reasons: integrityResult.reasons,
        flags: integrityResult.flags,
        maxCalculatedSpeedKmh: integrityResult.maxSpeedKmh,
        avgCalculatedSpeedKmh: integrityResult.avgSpeedKmh,
    };

    run.status = "completed";

    let xpEarned = 0;
    let streakInfo = null;
    let gridSummary = null;

    const user = providedUser || (await User.findById(run.userId));

    if (user) {
        if (!integrityResult.isFlagged) {
            // Legitimate run: Award XP, level up, update streak, award territory influence
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
        } else {
            // Flagged fraudulent/spoofed run: Withhold territory conquests & streaks
            user.cheatViolations = (user.cheatViolations || 0) + 1;
            
            if (user.cheatViolations >= 2) {
                user.isBanned = true;
                user.banReason = "Permanently exiled from the realm for repeated Anti-Cheat telemetry violations (2/2 strikes).";
                console.error(
                    `[Anti-Cheat BAN] User ${user.username} (ID: ${user._id}) PERMANENTLY BANNED on strike #${user.cheatViolations}.`
                );
            } else {
                console.warn(
                    `[Anti-Cheat STRIKE 1] User ${user.username} received strike #1/2. Next violation results in permanent ban.`
                );
            }

            await user.save();
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
        antiCheat: {
            ...run.antiCheat,
            userViolations: user?.cheatViolations || 1,
            isUserBanned: user?.isBanned || false,
        },
    };
};

module.exports = {
    calculatePace,
    processRunGrids,
    completeRun,
};
