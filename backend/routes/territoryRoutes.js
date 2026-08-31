const express = require('express');
const router = express.Router();

const auth = require("../middleware/auth");

const {
    getAllGrids,
    getGridDetails,
    getMyTerritories,
    getMyActiveConquests,
    nameTerritory,
} = require ("../controllers/territoryController");

router.get("/",auth,getAllGrids);
router.get("/my",auth,getMyTerritories);
router.get("/my-progress",auth,getMyActiveConquests);
router.get("/:gridId",auth,getGridDetails);
router.put("/:gridId/name",auth,nameTerritory);

module.exports = router;