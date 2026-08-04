const Grid = require("../models/Grid");
const GridInfluence = require("../models/Gridinfluence");

const GRID_SIZE_METERS = 1000;
const CLAIM_THRESHOLD = 700;

/*
 * Convert GPS coordinates to a unique grid ID
 */
function getGridIdFromCoordinates(lat, lng) {

    const metersPerDegreeLat = 111320;

    const metersPerDegreeLng =
        111320 * Math.cos(lat * Math.PI / 180);

    const row = Math.floor(
        (lat * metersPerDegreeLat) / GRID_SIZE_METERS
    );

    const col = Math.floor(
        (lng * metersPerDegreeLng) / GRID_SIZE_METERS
    );

    return `R${row}-C${col}`;
}

/*
 * Add influence earned from a run
 */
const addInfluenceToGrid = async (
    gridId,
    userId,
    xp,
    distance
) => {

    let grid = await Grid.findOne({ gridId });

    if (!grid) {
        grid = await Grid.create({
            gridId
        });
    }

    let influenceRecord = await GridInfluence.findOne({
        gridId: grid._id,
        userId
    });

    if (!influenceRecord) {
        influenceRecord = await GridInfluence.create({
            gridId: grid._id,
            userId
        });
    }

    influenceRecord.influence += xp;
    influenceRecord.totalDistance += distance;
    influenceRecord.totalRuns += 1;

    await influenceRecord.save();

    // Check if ownership should change
    await updateGridRuler(gridId);

    return influenceRecord;
};

/*
 * Claims unowned grids automatically.
 * Enemy-owned grids will require a future war system.
 */
const updateGridRuler = async (gridId) => {

    const grid = await Grid.findOne({ gridId });

    if (!grid) {
        return null;
    }

    const influences = await GridInfluence
        .find({ gridId: grid._id })
        .sort({ influence: -1 });

    if (influences.length === 0) {
        return grid;
    }

    const leader = influences[0];

    // Not enough influence to claim
    if (leader.influence < CLAIM_THRESHOLD) {
        return grid;
    }

    const currentRuler = grid.ruler
        ? grid.ruler.toString()
        : null;

    const newLeader = leader.userId.toString();

    if (currentRuler !== newLeader) {
        grid.ruler = leader.userId;
        grid.status = "claimed";

        if (!grid.claimedAt) {
            grid.claimedAt = new Date();
        }

        await grid.save();
    }

    return grid;
};

module.exports = {
    getGridIdFromCoordinates,
    addInfluenceToGrid,
    updateGridRuler
};