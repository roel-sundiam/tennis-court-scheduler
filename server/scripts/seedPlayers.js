require('dotenv').config();
const mongoose = require('mongoose');
const Player = require('../models/player');

const samplePlayers = [
  { name: 'Alice Johnson', seed: 1 },
  { name: 'Bob Smith', seed: 2 },
  { name: 'Charlie Davis', seed: 3 },
  { name: 'Diana Miller', seed: 4 },
  { name: 'Edward Wilson', seed: 5 },
  { name: 'Fiona Taylor', seed: 6 },
  { name: 'George Brown', seed: 7 },
  { name: 'Hannah Clark', seed: 8 }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await Player.deleteMany({});
    await Player.insertMany(samplePlayers);
    console.log('Sample players inserted!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding players:', err);
    process.exit(1);
  }
}

seed(); 