const express = require('express');
const router=express.Router();
const auth = require("../middleware/auth");
const {startRun,
       getRuns,
       getRunById,
       endRun,
       updateLocation,
       deleteRun,
       }=require('../controllers/runController');

router.post('/start',auth,startRun);
router.get('/',auth,getRuns);

router.get('/:id',auth,getRunById);
router.patch('/:id/location',auth,updateLocation);
router.patch('/:id/end',auth,endRun);
router.delete('/:id',auth,deleteRun);
module.exports=router;