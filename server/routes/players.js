const express = require('express');
const router = express.Router();
const Player = require('../models/player');

// Helper to map _id to id
function mapPlayer(p) {
  return {
    id: p._id.toString(),
    name: p.name,
    seed: p.seed
  };
}

// GET /players - list all players
router.get('/', async (req, res) => {
  try {
    const players = await Player.find().sort({ seed: 1 });
    res.json(players.map(mapPlayer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /players/:id - get player by id
router.get('/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(mapPlayer(player));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /players - create new player
router.post('/', async (req, res) => {
  try {
    const { name, seed } = req.body;
    const player = new Player({ name, seed });
    await player.save();
    res.status(201).json(mapPlayer(player));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /players/:id - update player
router.put('/:id', async (req, res) => {
  try {
    const { name, seed } = req.body;
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { name, seed },
      { new: true, runValidators: true }
    );
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(mapPlayer(player));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /players/:id - delete player
router.delete('/:id', async (req, res) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json({ message: 'Player deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 