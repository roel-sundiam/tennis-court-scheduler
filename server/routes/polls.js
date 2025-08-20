const express = require('express');
const router = express.Router();
const Poll = require('../models/poll');

// Helper function to generate rolling MWF (Monday/Wednesday/Friday) options starting from today if MWF
function generateRollingMWFOptions() {
  const options = [];
  const today = new Date();
  let currentDate = new Date(today);
  
  // Start from today (include today if it's MWF)
  const todayDayOfWeek = today.getDay();
  if (todayDayOfWeek !== 1 && todayDayOfWeek !== 3 && todayDayOfWeek !== 5) {
    // If today is not MWF, start from tomorrow
    currentDate.setDate(today.getDate() + 1);
  }
  
  // Generate options for the next 9 MWF dates (about 3 weeks)
  while (options.length < 9) {
    const dayOfWeek = currentDate.getDay();
    
    // Check if it's Monday (1), Wednesday (3), or Friday (5)
    if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
      const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      options.push({
        id: dateString,
        date: dateString,
        time: '', // No time
        maxPlayers: 8 // Default to 8 players (2 doubles matches)
      });
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return options;
}

// Get all polls with auto-refreshed rolling dates
router.get('/', async (req, res) => {
  try {
    const polls = await Poll.find();
    
    // Auto-refresh dates for all polls
    const currentRollingOptions = generateRollingMWFOptions();
    let updatedAny = false;
    
    for (const poll of polls) {
      const needsUpdate = !poll.options || 
                         poll.options.length === 0 || 
                         poll.options[0].date !== currentRollingOptions[0].date;
      
      if (needsUpdate) {
        console.log(`Updating poll ${poll.id} with rolling MWF dates: ${currentRollingOptions[0].date} to ${currentRollingOptions[currentRollingOptions.length-1].date}`);
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

    // Auto-refresh poll options to current rolling MWF window
    const currentRollingOptions = generateRollingMWFOptions();
    
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
      console.log(`Updating poll ${poll.id} with rolling MWF dates: ${currentRollingOptions[0].date} to ${currentRollingOptions[currentRollingOptions.length-1].date}`);
      
      // Create mapping of old dates to new dates to preserve votes
      const oldDates = poll.options.map(opt => opt.date);
      const newDates = currentRollingOptions.map(opt => opt.date);
      
      console.log('Old dates:', oldDates);
      console.log('New dates:', newDates);
      
      // Update votes to map old dates to new MWF dates where possible
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
      
      // Update poll options with new rolling MWF dates
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

// Remove ALL votes from a poll
router.delete('/:id/votes', async (req, res) => {
  try {
    console.log('🔵 DELETE /polls/:id/votes called with pollId:', req.params.id);
    
    const poll = await Poll.findOne({ id: req.params.id });
    if (!poll) {
      console.log('❌ Poll not found with id:', req.params.id);
      return res.status(404).json({ message: 'Poll not found' });
    }

    const beforeVotes = poll.votes.length;
    const beforeTotalVotes = poll.totalVotes;
    const beforeTeams = poll.generatedTeams ? poll.generatedTeams.length : 0;
    
    // Clear all votes and generated teams
    poll.votes = [];
    poll.totalVotes = 0;
    poll.generatedTeams = [];
    
    await poll.save();
    
    console.log(`🗑️ Cleared ALL votes: ${beforeVotes} -> 0 vote entries`);
    console.log(`🗑️ Cleared total votes: ${beforeTotalVotes} -> 0`);
    console.log(`🗑️ Cleared all generated teams: ${beforeTeams} -> 0 team entries`);
    console.log('✅ All votes and teams cleared successfully for poll:', req.params.id);
    
    res.json({ 
      message: 'All votes and teams cleared successfully', 
      beforeVotes,
      beforeTotalVotes,
      beforeTeams
    });
  } catch (error) {
    console.error('❌ Error clearing all votes:', error);
    res.status(500).json({ message: error.message });
  }
});

// Remove votes for a specific date
router.delete('/:id/votes/:dateId', async (req, res) => {
  try {
    console.log('🔵 DELETE /polls/:id/votes/:dateId called with pollId:', req.params.id, 'dateId:', req.params.dateId);
    
    const poll = await Poll.findOne({ id: req.params.id });
    if (!poll) {
      console.log('❌ Poll not found with id:', req.params.id);
      return res.status(404).json({ message: 'Poll not found' });
    }

    const targetDate = req.params.dateId;
    console.log('🎯 Target date to remove votes for:', targetDate);
    
    const beforeVotes = poll.votes.length;
    let removedVotesCount = 0;
    
    // Remove the target date from all votes and filter out empty votes
    poll.votes = poll.votes.map(vote => {
      const originalLength = vote.optionIds.length;
      vote.optionIds = vote.optionIds.filter(optionId => optionId !== targetDate);
      if (vote.optionIds.length < originalLength) {
        removedVotesCount++;
      }
      return vote;
    }).filter(vote => vote.optionIds.length > 0); // Remove votes that have no dates left
    
    const afterVotes = poll.votes.length;
    
    // Update totalVotes (recalculate based on current votes array)
    poll.totalVotes = poll.votes.reduce((sum, vote) => sum + vote.optionIds.length, 0);
    
    // Also clear any generated teams for this date
    const beforeTeams = poll.generatedTeams ? poll.generatedTeams.length : 0;
    poll.generatedTeams = poll.generatedTeams ? poll.generatedTeams.filter(gt => gt.dateId !== targetDate) : [];
    const afterTeams = poll.generatedTeams.length;
    
    await poll.save();
    
    console.log(`🗑️ Removed votes for ${targetDate}: ${beforeVotes} -> ${afterVotes} total votes`);
    console.log(`🗑️ Removed generated teams for ${targetDate}: ${beforeTeams} -> ${afterTeams} team entries`);
    console.log(`📊 Updated votes affected: ${removedVotesCount} players had their votes for ${targetDate} removed`);
    console.log('✅ Votes and teams cleared successfully for date:', targetDate);
    
    res.json({ 
      message: `Votes and teams for ${targetDate} removed successfully`, 
      removedVotesCount,
      beforeVotes,
      afterVotes,
      beforeTeams,
      afterTeams
    });
  } catch (error) {
    console.error('❌ Error removing votes for date:', error);
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