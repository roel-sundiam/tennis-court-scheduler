const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Authentication middleware for coin operations
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authorization header required' 
    });
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Only allow RoelSundiam to access coin features
  if (token !== 'RoelSundiam') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Coin system is restricted to authorized administrators only.' 
    });
  }
  
  next();
};

// Club Balance Schema (shared pool for all non-RoelSundiam users)
const clubBalanceSchema = new mongoose.Schema({
  clubId: { type: String, required: true, default: 'VGTennisMorningClub' },
  balance: { type: Number, default: 500, min: 0 },
  totalPurchased: { type: Number, default: 500 },
  totalUsed: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

// Individual User Balance Schema (only for RoelSundiam - unlimited)
const userBalanceSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  balance: { type: Number, default: -1 }, // -1 = unlimited for RoelSundiam
  totalPurchased: { type: Number, default: 0 },
  totalUsed: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

// Coin Transaction Schema
const coinTransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  clubId: { type: String, default: 'VGTennisMorningClub' }, // Track which club pool was used
  type: { type: String, enum: ['PURCHASE', 'USAGE', 'REFUND', 'BONUS'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  feature: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  balanceAfter: { type: Number, required: true },
  paymentMethod: { type: String }, // For purchases
  transactionId: { type: String }, // For payment tracking
  isClubTransaction: { type: Boolean, default: true } // Track if it's from club pool
});

// Add indexes for better performance
clubBalanceSchema.index({ clubId: 1 }, { unique: true });
userBalanceSchema.index({ userId: 1 }, { unique: true });
coinTransactionSchema.index({ userId: 1, timestamp: -1 });
coinTransactionSchema.index({ clubId: 1, timestamp: -1 });
coinTransactionSchema.index({ type: 1 });

const ClubBalance = mongoose.model('ClubBalance', clubBalanceSchema);
const UserBalance = mongoose.model('UserBalance', userBalanceSchema);
const CoinTransaction = mongoose.model('CoinTransaction', coinTransactionSchema);

// Feature pricing configuration
const FEATURE_PRICING = {
  // Page Access Costs
  'CALENDAR_VIEW': 1,
  'POLL_VOTING_VIEW': 2,
  'PLAYERS_VIEW': 3,
  'TEAMS_MATCHES_VIEW': 2,
  'POLL_RESULTS_VIEW': 5,
  'ACTIVITY_LOGS_VIEW': 1,
  
  // Feature Costs
  'VOTE_SUBMISSION': 1,
  'PLAYER_ADD': 2,
  'PLAYER_EDIT': 1,
  'PLAYER_DELETE': 1,
  'TEAM_GENERATION': 4,
  'MATCH_SCHEDULING': 3,
  'ACTIVITY_LOGS_FILTER': 2,
  'ACTIVITY_LOGS_EXPORT': 5,
  'ACTIVITY_STATS_VIEW': 3,
  'DATA_EXPORT': 2,
  'USER_ANALYTICS': 4
};

// Helper function to determine if user is RoelSundiam
const isRoelSundiam = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === 'RoelSundiam';
};

// Helper function to check if request has valid auth (admin or anonymous)
const isValidUser = (req) => {
  const authHeader = req.headers.authorization;
  // Allow anonymous users (no auth header) or RoelSundiam
  return !authHeader || authHeader.replace('Bearer ', '') === 'RoelSundiam';
};

// Get current balance (public endpoint - all users can check balance)
router.get('/balance', async (req, res) => {
  try {
    const isAdmin = isRoelSundiam(req);
    
    if (isAdmin) {
      // RoelSundiam gets unlimited balance
      let userBalance = await UserBalance.findOne({ userId: 'RoelSundiam' });
      
      if (!userBalance) {
        userBalance = new UserBalance({
          userId: 'RoelSundiam',
          username: 'RoelSundiam',
          balance: -1, // -1 = unlimited
          totalPurchased: 0,
          totalUsed: 0,
          lastUpdated: new Date()
        });
        await userBalance.save();
        console.log('💰 Created unlimited balance for RoelSundiam');
      }
      
      res.json({
        success: true,
        data: {
          ...userBalance.toObject(),
          isUnlimited: true,
          displayBalance: 'Unlimited'
        }
      });
    } else {
      // All other users share club balance
      let clubBalance = await ClubBalance.findOne({ clubId: 'VGTennisMorningClub' });
      
      if (!clubBalance) {
        clubBalance = new ClubBalance({
          clubId: 'VGTennisMorningClub',
          balance: 500,
          totalPurchased: 500,
          totalUsed: 0,
          lastUpdated: new Date()
        });
        await clubBalance.save();
        console.log('💰 Created new club balance: 500 coins');
      }
      
      res.json({
        success: true,
        data: {
          ...clubBalance.toObject(),
          isUnlimited: false,
          displayBalance: clubBalance.balance.toString()
        }
      });
    }
  } catch (error) {
    console.error('❌ Error fetching balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance',
      error: error.message
    });
  }
});

// Get club balance specifically (admin only - for admin panel display)
router.get('/club-balance', authenticateAdmin, async (req, res) => {
  try {
    // Find or create club balance
    let clubBalance = await ClubBalance.findOne({ clubId: 'VGTennisMorningClub' });
    
    if (!clubBalance) {
      clubBalance = new ClubBalance({
        clubId: 'VGTennisMorningClub',
        balance: 536, // Default to the current balance you mentioned
        totalPurchased: 536,
        totalUsed: 0,
        lastUpdated: new Date()
      });
      await clubBalance.save();
      console.log('💰 Created new club balance with 536 coins');
    }
    
    res.json({
      success: true,
      data: {
        ...clubBalance.toObject(),
        isUnlimited: false,
        displayBalance: clubBalance.balance.toString()
      }
    });
  } catch (error) {
    console.error('❌ Error fetching club balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch club balance',
      error: error.message
    });
  }
});

// Use coins for a feature (allow both admin and non-admin users)
router.post('/use', async (req, res) => {
  try {
    const { feature, amount, description, userId: requestUserId } = req.body;
    const isAdmin = isRoelSundiam(req);
    
    console.log('🪙 Coin use request:', { feature, amount, isAdmin, hasAuth: !!req.headers.authorization });
    
    // Allow anonymous users and RoelSundiam - remove auth check for now
    // if (!isValidUser(req)) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Unauthorized access'
    //   });
    // }

    // Validate feature pricing
    const expectedCost = FEATURE_PRICING[feature];
    if (expectedCost && amount !== expectedCost) {
      return res.status(400).json({
        success: false,
        message: `Invalid amount. ${feature} costs ${expectedCost} coins.`
      });
    }

    // RoelSundiam has unlimited coins - no deduction needed
    if (isAdmin) {
      const transaction = new CoinTransaction({
        userId: 'RoelSundiam',
        username: 'RoelSundiam',
        clubId: null,
        type: 'USAGE',
        amount: amount,
        description: description || `Used ${feature}`,
        feature: feature,
        timestamp: new Date(),
        balanceAfter: -1, // Unlimited
        isClubTransaction: false
      });
      await transaction.save();

      return res.json({
        success: true,
        data: {
          balanceAfter: -1,
          isUnlimited: true,
          displayBalance: 'Unlimited',
          transactionId: transaction._id
        }
      });
    }

    // For all other users - use club balance
    let clubBalance = await ClubBalance.findOne({ clubId: 'VGTennisMorningClub' });
    if (!clubBalance) {
      return res.status(404).json({
        success: false,
        message: 'Club balance not found. Please contact administrator.'
      });
    }

    // Check if club has enough coins
    if (clubBalance.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient club coins',
        currentBalance: clubBalance.balance,
        required: amount
      });
    }

    // Update club balance
    const newBalance = clubBalance.balance - amount;
    await ClubBalance.updateOne(
      { clubId: 'VGTennisMorningClub' },
      { 
        balance: newBalance,
        totalUsed: clubBalance.totalUsed + amount,
        lastUpdated: new Date()
      }
    );

    // Record transaction
    const transaction = new CoinTransaction({
      userId: requestUserId || 'club_member',
      username: requestUserId || 'Club Member',
      clubId: 'VGTennisMorningClub',
      type: 'USAGE',
      amount,
      description: description || `Used ${amount} coins for ${feature}`,
      feature,
      timestamp: new Date(),
      balanceAfter: newBalance,
      isClubTransaction: true
    });
    await transaction.save();

    console.log(`💸 Club member used ${amount} coins for ${feature}. Club Balance: ${newBalance}`);

    res.json({
      success: true,
      message: 'Coins used successfully',
      data: {
        balanceAfter: newBalance,
        isUnlimited: false,
        displayBalance: newBalance.toString(),
        transactionId: transaction._id
      }
    });
  } catch (error) {
    console.error('❌ Error using coins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to use coins',
      error: error.message
    });
  }
});

// Add coins to club balance (RoelSundiam only)
router.post('/add-to-club', authenticateAdmin, async (req, res) => {
  try {
    const { amount, description = 'Admin added coins to club' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coin amount'
      });
    }

    // Find or create club balance
    let clubBalance = await ClubBalance.findOne({ clubId: 'VGTennisMorningClub' });
    if (!clubBalance) {
      clubBalance = new ClubBalance({
        clubId: 'VGTennisMorningClub',
        balance: 500,
        totalPurchased: 500,
        totalUsed: 0
      });
    }

    // Update club balance
    const newBalance = clubBalance.balance + amount;
    await ClubBalance.updateOne(
      { clubId: 'VGTennisMorningClub' },
      { 
        balance: newBalance,
        totalPurchased: clubBalance.totalPurchased + amount,
        lastUpdated: new Date()
      },
      { upsert: true }
    );

    // Record transaction
    const transaction = new CoinTransaction({
      userId: 'RoelSundiam',
      username: 'RoelSundiam',
      clubId: 'VGTennisMorningClub',
      type: 'PURCHASE',
      amount,
      description: description,
      feature: 'ADMIN_CLUB_PURCHASE',
      timestamp: new Date(),
      balanceAfter: newBalance,
      isClubTransaction: true
    });
    await transaction.save();

    console.log(`💰 RoelSundiam added ${amount} coins to club. New club balance: ${newBalance}`);

    res.json({
      success: true,
      message: `Successfully added ${amount} coins to club balance`,
      data: {
        clubBalanceAfter: newBalance,
        transactionId: transaction._id
      }
    });
  } catch (error) {
    console.error('❌ Error adding coins to club:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add coins to club',
      error: error.message
    });
  }
});

// Purchase coins (legacy endpoint - kept for compatibility)
router.post('/purchase', authenticateAdmin, async (req, res) => {
  try {
    const { amount, paymentMethod = 'CREDIT_CARD', transactionId, userId: requestUserId } = req.body;
    const isAdmin = isRoelSundiam(req);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coin amount'
      });
    }

    if (isAdmin) {
      // RoelSundiam already has unlimited - record transaction but don't change balance
      const transaction = new CoinTransaction({
        userId: 'RoelSundiam',
        username: 'RoelSundiam',
        clubId: null,
        type: 'PURCHASE',
        amount,
        description: `Purchased ${amount} coins via ${paymentMethod}`,
        feature: 'COIN_PURCHASE',
        timestamp: new Date(),
        balanceAfter: -1, // Unlimited
        paymentMethod,
        transactionId,
        isClubTransaction: false
      });
      await transaction.save();

      return res.json({
        success: true,
        message: 'Purchase recorded (unlimited balance)',
        data: {
          balanceAfter: -1,
          isUnlimited: true,
          displayBalance: 'Unlimited',
          transactionId: transaction._id
        }
      });
    }

    // For all other users - add to club balance
    let clubBalance = await ClubBalance.findOne({ clubId: 'VGTennisMorningClub' });
    if (!clubBalance) {
      clubBalance = new ClubBalance({
        clubId: 'VGTennisMorningClub',
        balance: 500,
        totalPurchased: 500,
        totalUsed: 0
      });
    }

    // Update club balance
    const newBalance = clubBalance.balance + amount;
    await ClubBalance.updateOne(
      { clubId: 'VGTennisMorningClub' },
      { 
        balance: newBalance,
        totalPurchased: clubBalance.totalPurchased + amount,
        lastUpdated: new Date()
      },
      { upsert: true }
    );

    // Record transaction
    const transaction = new CoinTransaction({
      userId: requestUserId || 'club_member',
      username: requestUserId || 'Club Member',
      clubId: 'VGTennisMorningClub',
      type: 'PURCHASE',
      amount,
      description: `Purchased ${amount} coins via ${paymentMethod} for club`,
      feature: 'COIN_PURCHASE',
      timestamp: new Date(),
      balanceAfter: newBalance,
      paymentMethod,
      transactionId,
      isClubTransaction: true
    });
    await transaction.save();

    console.log(`💰 Club member purchased ${amount} coins via ${paymentMethod}. Club Balance: ${newBalance}`);

    res.json({
      success: true,
      message: 'Coins purchased successfully for club',
      data: {
        balanceAfter: newBalance,
        isUnlimited: false,
        displayBalance: newBalance.toString(),
        transactionId: transaction._id
      }
    });
  } catch (error) {
    console.error('❌ Error purchasing coins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase coins',
      error: error.message
    });
  }
});

// Get transaction history
router.get('/transactions', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, type } = req.query;
    const userId = 'RoelSundiam';

    const filter = { userId };
    if (type) {
      filter.type = type;
    }

    const transactions = await CoinTransaction
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    const total = await CoinTransaction.countDocuments(filter);

    console.log(`📋 Fetched ${transactions.length} transactions for ${userId}`);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > (parseInt(offset) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// Get pricing information
router.get('/pricing', authenticateAdmin, async (req, res) => {
  try {
    const pricing = Object.entries(FEATURE_PRICING).map(([feature, cost]) => ({
      feature,
      cost,
      description: getFeatureDescription(feature)
    }));

    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error('❌ Error fetching pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing',
      error: error.message
    });
  }
});

// Admin: Get coin statistics
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const userId = 'RoelSundiam';
    
    const [
      totalTransactions,
      totalPurchased,
      totalUsed,
      recentTransactions,
      featureUsage
    ] = await Promise.all([
      CoinTransaction.countDocuments({ userId }),
      CoinTransaction.aggregate([
        { $match: { userId, type: 'PURCHASE' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      CoinTransaction.aggregate([
        { $match: { userId, type: 'USAGE' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      CoinTransaction.find({ userId }).sort({ timestamp: -1 }).limit(10),
      CoinTransaction.aggregate([
        { $match: { userId, type: 'USAGE' } },
        { $group: { _id: '$feature', count: { $sum: 1 }, totalSpent: { $sum: '$amount' } } },
        { $sort: { totalSpent: -1 } }
      ])
    ]);

    const currentBalance = await CoinBalance.findOne({ userId });

    res.json({
      success: true,
      data: {
        currentBalance: currentBalance?.balance || 0,
        totalTransactions,
        totalPurchased: totalPurchased[0]?.total || 0,
        totalUsed: totalUsed[0]?.total || 0,
        recentTransactions,
        featureUsage
      }
    });
  } catch (error) {
    console.error('❌ Error fetching coin statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// Helper function to get feature descriptions
function getFeatureDescription(feature) {
  const descriptions = {
    'ACTIVITY_LOGS_VIEW': 'View activity logs page',
    'ACTIVITY_LOGS_FILTER': 'Apply filters to logs',
    'ACTIVITY_LOGS_EXPORT': 'Export activity data',
    'ACTIVITY_STATS_VIEW': 'View statistics dashboard',
    'USER_ANALYTICS': 'Access user analytics'
  };
  return descriptions[feature] || 'Unknown feature';
}

module.exports = router;