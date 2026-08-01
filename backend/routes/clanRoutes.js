const express = require('express');
const { getClans, createClan, joinClan } = require('../controllers/clanController');
const auth = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(auth, getClans)
  .post(auth, createClan);

router.route('/:id/join')
  .post(auth, joinClan);

module.exports = router;
