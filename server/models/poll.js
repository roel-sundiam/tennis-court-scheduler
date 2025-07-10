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

const pollSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  options: [pollOptionSchema],
  votes: [voteSchema]
}, { timestamps: true });

module.exports = mongoose.model('Poll', pollSchema); 