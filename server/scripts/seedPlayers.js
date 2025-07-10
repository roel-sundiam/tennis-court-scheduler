require('dotenv').config();
const mongoose = require('mongoose');
const Player = require('../models/player');
const Poll = require('../models/Poll');

const samplePlayers = [
  { name: 'Adrian Mallari Alejandrino', seed: 1 },
  { name: 'Aileen G. Flores', seed: 2 },
  { name: 'Allan P. Gatchalian', seed: 3 },
  { name: 'Andrew Salas', seed: 4 },
  { name: 'Ariel Almeida', seed: 5 },
  { name: 'Bats Dungca', seed: 6 },
  { name: 'Bernard Pangilinan Dizon', seed: 7 },
  { name: 'Bfa Deepwell', seed: 8 },
  { name: 'Bobbit Abad Santos', seed: 9 },
  { name: 'Carlo Datu', seed: 10 },
  { name: 'Cora Bautista-Almeida', seed: 11 },
  { name: 'Doro Dico', seed: 12 },
  { name: 'Dwight Morales', seed: 13 },
  { name: 'Eddie Gantan', seed: 14 },
  { name: 'Ekim Otilopih Arevir', seed: 15 },
  { name: 'Emerson Tolentino', seed: 16 },
  { name: 'Eril JY', seed: 17 },
  { name: 'Erlinda De Leon-Alejandrino', seed: 18 },
  { name: 'Francis Gerard Estrada', seed: 19 },
  { name: 'Jowil David', seed: 20 },
  { name: 'Kate MT', seed: 21 },
  { name: 'Ladyjae Valerio', seed: 22 },
  { name: 'Leo Benitez', seed: 23 },
  { name: 'Leoces Dela Cruz', seed: 24 },
  { name: 'Mhon Sengson', seed: 25 },
  { name: 'Noel Lacsamana', seed: 26 },
  { name: 'Reynaldo Sangalang Manalastas', seed: 27 },
  { name: 'Rico Yumang', seed: 28 },
  { name: 'Roel Sundiam', seed: 29 },
  { name: 'Romel Fong', seed: 30 },
  { name: 'Sungwoo Jeon', seed: 31 },
  { name: 'Tess Pennell', seed: 32 },
  { name: 'Val Nepomuceno Antonio', seed: 33 },
  { name: 'Vic Dela Resma', seed: 34 },
  { name: 'Vince Ayson', seed: 35 },
  { name: 'Virick Paras Vitug', seed: 36 },
  { name: 'Willie Dizon', seed: 37 }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🗑️ Clearing existing data...');
    
    // Delete all existing players
    await Player.deleteMany({});
    console.log('✅ Deleted all existing players');
    
    // Clear all votes and generated teams from polls
    await Poll.updateMany({}, { 
      $set: { 
        votes: [], 
        generatedTeams: [] 
      } 
    });
    console.log('✅ Cleared all votes and generated teams from polls');
    
    // Insert new players
    await Player.insertMany(samplePlayers);
    console.log('✅ Inserted 37 new tennis club players');
    
    console.log('🎾 Database reset complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
}

seed(); 