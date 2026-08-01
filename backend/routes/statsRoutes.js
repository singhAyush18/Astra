const express = require('express');
const router=express.Router();
const auth = require("../middleware/auth");
const {getRunStats,
    getLeaderboard,
    getGlobalLeaderboard,
    getGamificationstats
                   }=require('../controllers/statsController');

router.get('/runs',auth, getRunStats);
router.get('/leaderboard',auth, getLeaderboard);
router.get('/leaderboard/global',auth, getGlobalLeaderboard);
router.get('/gamificationstats',auth, getGamificationstats);
router.get('/gamification',auth, getGamificationstats);
module.exports=router;