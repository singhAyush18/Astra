const Clan = require('../models/Clan');
const User = require('../models/User');

const getClans = async (req, res) => {
  try {
    const clans = await Clan.find().populate('leader', 'username').sort({ totalXp: -1 });
    res.status(200).json({ success: true, data: clans });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const createClan = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Check if user is already in a clan (optional logic, but let's allow only one clan for now)
    const existingClan = await Clan.findOne({ members: req.user.id });
    if (existingClan) {
      return res.status(400).json({ success: false, message: 'You are already in a clan' });
    }

    const clan = await Clan.create({
      name,
      description,
      leader: req.user.id,
      members: [req.user.id]
    });

    res.status(201).json({ success: true, data: clan });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Clan name already taken' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const joinClan = async (req, res) => {
  try {
    const { id } = req.params;

    const existingClan = await Clan.findOne({ members: req.user.id });
    if (existingClan) {
      return res.status(400).json({ success: false, message: 'You are already in a clan' });
    }

    const clan = await Clan.findById(id);
    if (!clan) {
      return res.status(404).json({ success: false, message: 'Clan not found' });
    }

    clan.members.push(req.user.id);
    await clan.save();

    res.status(200).json({ success: true, data: clan, message: 'Successfully joined clan' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getClans,
  createClan,
  joinClan
};
