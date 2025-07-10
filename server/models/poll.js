const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  playerId: { type: String, required: true },
  optionIds: [{ type: String, required: true }]
}, { timestamps: true });

const pollOptionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, default: '' }
});

// Team and Match schemas for generated teams
const teamSchema = new mongoose.Schema({
  id: { type: String, required: true },
  player1: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    seed: { type: Number, required: true }
  },
  player2: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    seed: { type: Number, required: true }
  },
  averageSeed: { type: Number, required: true }
});

const matchSchema = new mongoose.Schema({
  id: { type: String, required: true },
  teamA: teamSchema,
  teamB: teamSchema
});

const generatedTeamsSchema = new mongoose.Schema({
  dateId: { type: String, required: true },
  algorithm: { type: String, required: true },
  teams: [teamSchema],
  matches: [matchSchema],
  reservePlayers: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    seed: { type: Number, required: true }
  }]
}, { timestamps: true });

const pollSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  options: [pollOptionSchema],
  votes: [voteSchema],
  generatedTeams: [generatedTeamsSchema]
}, { timestamps: true });

module.exports = mongoose.model('Poll', pollSchema); 