const express = require('express');
const router = express.Router();
const Poll = require('../models/poll');

// Helper function to generate rolling 7-day options starting from tomorrow
function generateRollingWeeklyOptions() {
  const options = [];
  const today = new Date();
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    options.push({
      id: dateString,
      date: dateString,
      time: '', // No time
      maxPlayers: 8 // Default to 8 players (2 doubles matches)
    });
  }
  
  return options;
}

// Get all polls with auto-refreshed rolling dates
router.get('/', async (req, res) => {
  try {
    const polls = await Poll.find();
    
    // Auto-refresh dates for all polls
    const currentRollingOptions = generateRollingWeeklyOptions();
    let updatedAny = false;
    
    for (const poll of polls) {
      const needsUpdate = !poll.options || 
                         poll.options.length === 0 || 
                         poll.options[0].date !== currentRollingOptions[0].date;
      
      if (needsUpdate) {
        console.log(`Updating poll ${poll.id} with rolling dates: ${currentRollingOptions[0].date} to ${currentRollingOptions[6].date}`);
        poll.options = currentRollingOptions;
        await poll.save();
        updatedAny = true;
      }
    }
    
    if (updatedAny) {
      console.log('Some polls were updated with current rolling dates');
    }
    
    res.json(polls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get poll by ID with auto-refreshed rolling dates
router.get('/:id', async (req, res) => {
  try {
    const poll = await Poll.findOne({ id: req.params.id });
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Auto-refresh poll options to current rolling 7-day window
    const currentRollingOptions = generateRollingWeeklyOptions();
    
    // Check if the poll dates need updating (compare first date)
    const needsUpdate = !poll.options || 
                       poll.options.length === 0 || 
                       poll.options[0].date !== currentRollingOptions[0].date;
                       
    // Also check if any votes reference dates not in the current rolling window
    const hasStaleVotes = poll.votes && poll.votes.some(vote => 
      vote.optionIds && vote.optionIds.some(optionId => 
        !currentRollingOptions.some(opt => opt.date === optionId)
      )
    );
    
    const shouldUpdate = needsUpdate || hasStaleVotes;
    
    if (hasStaleVotes) {
      console.log('Found stale votes, will clean them up');
    }
    
    if (shouldUpdate) {
      console.log(`Updating poll ${poll.id} with rolling dates: ${currentRollingOptions[0].date} to ${currentRollingOptions[6].date}`);
      
      // Create mapping of old dates to new dates to preserve votes
      const oldDates = poll.options.map(opt => opt.date);
      const newDates = currentRollingOptions.map(opt => opt.date);
      
      console.log('Old dates:', oldDates);
      console.log('New dates:', newDates);
      
      // Update votes to map old dates to new dates where possible
      // For simplicity, we'll keep overlapping dates and remove votes for dates no longer available
      poll.votes = poll.votes.map(vote => {
        const updatedOptionIds = vote.optionIds.filter(optionId => 
          newDates.includes(optionId) // Keep only votes for dates that are still in the new window
        );
        
        return {
          ...vote,
          optionIds: updatedOptionIds
        };
      }).filter(vote => vote.optionIds.length > 0); // Remove votes that have no valid dates left
      
      // Update poll options with new rolling dates
      poll.options = currentRollingOptions;
      
      // Save the updated poll
      await poll.save();
      
      console.log('Updated poll votes:', poll.votes);
    }

    res.json(poll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new poll
router.post('/', async (req, res) => {
  try {
    const poll = new Poll(req.body);
    const newPoll = await poll.save();
    res.status(201).json(newPoll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a poll
router.put('/:id', async (req, res) => {
  try {
    const poll = await Poll.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    res.json(poll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Submit a vote for a poll
router.post('/:id/vote', async (req, res) => {
  try {
    const poll = await Poll.findOne({ id: req.params.id });
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const { playerName, playerId, optionIds } = req.body;
    
    console.log('🔵 Vote submission request:', { playerName, playerId, optionIds, optionIdsType: typeof optionIds, optionIdsLength: optionIds?.length });
    
    if (!playerId || optionIds === undefined || optionIds === null) {
      console.log('❌ Validation failed:', { playerId: !!playerId, optionIds, optionIdsUndefined: optionIds === undefined, optionIdsNull: optionIds === null });
      return res.status(400).json({ message: 'Player ID and option IDs are required' });
    }

    // Handle case where user wants to remove all votes (empty optionIds array)
    if (optionIds.length === 0) {
      console.log('🗑️ Removing all votes for player:', playerId);
      // Find and remove existing vote for this player
      const existingVoteIndex = poll.votes.findIndex(vote => vote.playerId === playerId);
      
      if (existingVoteIndex !== -1) {
        poll.votes.splice(existingVoteIndex, 1);
        // Update totalVotes (recalculate based on current votes array)
        poll.totalVotes = poll.votes.reduce((sum, vote) => sum + vote.optionIds.length, 0);
        const updatedPoll = await poll.save();
        console.log('✅ All votes removed successfully for player:', playerId);
        return res.status(200).json({ message: 'All votes removed successfully!', poll: updatedPoll });
      } else {
        console.log('⚠️ No existing votes found to remove for player:', playerId);
        return res.status(200).json({ message: 'No votes to remove.', poll: poll });
      }
    }

    // Sort optionIds for consistent comparison
    const sortedNewOptionIds = [...optionIds].sort();

    // Find existing vote for this player
    const existingVoteIndex = poll.votes.findIndex(vote => vote.playerId === playerId);

    if (existingVoteIndex !== -1) {
      const existingVote = poll.votes[existingVoteIndex];
      const sortedExistingOptionIds = [...existingVote.optionIds].sort();

      // Check if the new vote is identical to the existing one
      if (JSON.stringify(sortedNewOptionIds) === JSON.stringify(sortedExistingOptionIds)) {
        return res.status(200).json({ message: 'Vote already recorded.', poll: poll });
      }

      // If not identical, remove the old vote for this player
      poll.votes.splice(existingVoteIndex, 1);
    }

    // Add new vote
    poll.votes.push({
      playerName,
      playerId,
      optionIds: sortedNewOptionIds
    });

    // Update totalVotes (recalculate based on current votes array)
    poll.totalVotes = poll.votes.reduce((sum, vote) => sum + vote.optionIds.length, 0);

    const updatedPoll = await poll.save();
    res.status(200).json({ message: 'Vote submitted successfully!', poll: updatedPoll });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Save generated teams for a poll (admin only)
router.post('/:id/teams', async (req, res) => {
  try {
    console.log('🔵 POST /polls/:id/teams called with pollId:', req.params.id);
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    const poll = await Poll.findOne({ id: req.params.id });
    if (!poll) {
      console.log('❌ Poll not found with id:', req.params.id);
      return res.status(404).json({ message: 'Poll not found' });
    }

    const { dateId, algorithm, teams, matches, reservePlayers } = req.body;
    
    if (!dateId || !algorithm || !teams || !matches) {
      console.log('❌ Missing required data:', { dateId, algorithm, teams: !!teams, matches: !!matches });
      return res.status(400).json({ message: 'Missing required team generation data' });
    }

    // Remove existing generated teams for this date
    const beforeCount = poll.generatedTeams ? poll.generatedTeams.length : 0;
    poll.generatedTeams = poll.generatedTeams ? poll.generatedTeams.filter(gt => gt.dateId !== dateId) : [];
    const afterFilterCount = poll.generatedTeams.length;
    console.log(`🗑️ Removed existing teams: ${beforeCount} -> ${afterFilterCount}`);
    
    // Add new generated teams
    poll.generatedTeams.push({
      dateId,
      algorithm,
      teams,
      matches,
      reservePlayers: reservePlayers || []
    });

    console.log('💾 Saving poll with', poll.generatedTeams.length, 'generated team entries');
    await poll.save();
    
    console.log('✅ Teams saved successfully for poll:', req.params.id);
    res.json({ message: 'Teams saved successfully', poll: poll });
  } catch (error) {
    console.error('❌ Error saving teams:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get generated teams for a poll
router.get('/:id/teams', async (req, res) => {
  try {
    console.log('🔵 GET /polls/:id/teams called with pollId:', req.params.id);
    
    const poll = await Poll.findOne({ id: req.params.id });
    if (!poll) {
      console.log('❌ Poll not found with id:', req.params.id);
      return res.status(404).json({ message: 'Poll not found' });
    }

    const generatedTeams = poll.generatedTeams || [];
    console.log('📤 Returning generated teams:', generatedTeams.length, 'entries');
    console.log('📊 Teams data:', JSON.stringify(generatedTeams, null, 2));

    res.json({ generatedTeams });
  } catch (error) {
    console.error('❌ Error getting teams:', error);
    res.status(500).json({ message: error.message });
  }
});

// Clear all generated teams for a poll (called when votes change)
router.delete('/:id/teams', async (req, res) => {
  try {
    console.log('🔵 DELETE /polls/:id/teams called with pollId:', req.params.id);
    
    const poll = await Poll.findOne({ id: req.params.id });
    if (!poll) {
      console.log('❌ Poll not found with id:', req.params.id);
      return res.status(404).json({ message: 'Poll not found' });
    }

    const beforeCount = poll.generatedTeams ? poll.generatedTeams.length : 0;
    poll.generatedTeams = [];
    await poll.save();
    
    console.log(`🗑️ Cleared all generated teams: ${beforeCount} -> 0`);
    console.log('✅ All teams cleared successfully for poll:', req.params.id);
    
    res.json({ message: 'All generated teams cleared successfully', clearedCount: beforeCount });
  } catch (error) {
    console.error('❌ Error clearing teams:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a poll
router.delete('/:id', async (req, res) => {
  try {
    const poll = await Poll.findOneAndDelete({ id: req.params.id });
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    res.json({ message: 'Poll deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;