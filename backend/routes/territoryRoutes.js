const express = require('express');
const router = express.Router();

const auth = require("../middleware/auth");

const {
    getAllGrids,
    getGridDetails,
    getMyTerritories,
} = require ("../controllers/territoryController");

router.get("/",auth,getAllGrids);
router.get("/my",auth,getMyTerritories);
router.get("/:gridId",auth,getGridDetails);

module.exports = router;