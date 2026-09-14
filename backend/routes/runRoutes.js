const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const { runLimiter, aiLimiter } = require("../middleware/rateLimiter");
const { 
    startRun,
    getRuns,
    getRunById,
    endRun,
    generateRunDebrief,
    updateLocation,
    deleteRun,
} = require('../controllers/runController');

router.post('/start', auth, startRun);
router.get('/', auth, getRuns);
router.get('/:id', auth, getRunById);
router.patch('/:id/location', auth, updateLocation);
router.patch('/:id/end', auth, runLimiter, endRun);
router.post('/:id/debrief', auth, aiLimiter, generateRunDebrief);
router.delete('/:id', auth, deleteRun);

module.exports = router;