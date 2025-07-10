require('dotenv').config();
const mongoose = require('mongoose');
const Poll = require('../models/poll');

// Generate weekly options (next 7 days starting from tomorrow)
function generateWeeklyOptions() {
  const options = [];
  const today = new Date();
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    options.push({
      id: dateString,
      date: dateString,
      time: '' // No specific time, just the date
    });
  }
  
  return options;
}

async function seedPoll() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if poll already exists
    const existingPoll = await Poll.findOne({ id: '1' });
    if (existingPoll) {
      console.log('Poll already exists, updating options...');
      existingPoll.options = generateWeeklyOptions();
      await existingPoll.save();
      console.log('Poll updated successfully');
    } else {
      // Create new poll
      const poll = new Poll({
        id: '1',
        title: 'Weekly Tennis Court Availability',
        description: 'Vote for your preferred dates for this week!',
        options: generateWeeklyOptions(),
        votes: []
      });
      
      await poll.save();
      console.log('Poll created successfully');
    }

    console.log('Poll seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding poll:', error);
    process.exit(1);
  }
}

seedPoll(); 