const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Authentication middleware for activity logs access
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authorization header required' 
    });
  }

  // Extract username from Authorization header
  // Expected format: "Bearer username" or just "username"
  const token = authHeader.replace('Bearer ', '');
  
  // Only allow RoelSundiam to access activity logs
  if (token !== 'RoelSundiam') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Activity logs are restricted to authorized administrators only.' 
    });
  }
  
  next();
};

// Activity Log Schema
const activityLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  userRole: { type: String, enum: ['admin', 'user', 'anonymous'], required: true },
  action: { type: String, required: true },
  page: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  userAgent: { type: String },
  ipAddress: { type: String },
  sessionId: { type: String, required: true },
  additionalData: { type: mongoose.Schema.Types.Mixed }
});

// Add indexes for better query performance
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ userRole: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

// Middleware to capture IP address
const captureIP = (req, res, next) => {
  req.clientIP = req.headers['x-forwarded-for'] || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress ||
                 (req.connection.socket ? req.connection.socket.remoteAddress : null);
  next();
};

// Create new activity log
router.post('/', captureIP, async (req, res) => {
  try {
    console.log('📝 Activity Log Entry:', {
      user: req.body.username,
      action: req.body.action,
      page: req.body.page,
      ip: req.clientIP
    });

    const logData = {
      ...req.body,
      ipAddress: req.clientIP,
      timestamp: new Date(req.body.timestamp || Date.now())
    };

    const activityLog = new ActivityLog(logData);
    const savedLog = await activityLog.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Activity logged successfully',
      logId: savedLog._id 
    });
  } catch (error) {
    console.error('❌ Error saving activity log:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to log activity',
      error: error.message 
    });
  }
});

// Get activity logs with pagination and filtering (PROTECTED)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      userId,
      action,
      userRole,
      startDate,
      endDate,
      page
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (userRole) filter.userRole = userRole;
    if (page) filter.page = { $regex: page, $options: 'i' };
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    console.log('🔍 Fetching activity logs with filter:', filter);

    const logs = await ActivityLog
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    const total = await ActivityLog.countDocuments(filter);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > (parseInt(offset) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching activity logs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch activity logs',
      error: error.message 
    });
  }
});

// Get activity logs for specific user (PROTECTED)
router.get('/user/:userId', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    console.log(`🔍 Fetching activity logs for user: ${userId}`);

    const logs = await ActivityLog
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    const total = await ActivityLog.countDocuments({ userId });

    res.json({
      success: true,
      data: logs,
      user: userId,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > (parseInt(offset) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user activity logs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user activity logs',
      error: error.message 
    });
  }
});

// Get activity statistics (PROTECTED)
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }

    console.log('📊 Generating activity statistics');

    // Aggregate statistics
    const [
      totalLogs,
      userStats,
      actionStats,
      pageStats,
      dailyStats
    ] = await Promise.all([
      // Total logs count
      ActivityLog.countDocuments(dateFilter),
      
      // User activity breakdown
      ActivityLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: { userId: '$userId', userRole: '$userRole' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Action breakdown
      ActivityLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Page access breakdown
      ActivityLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$page', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Daily activity (last 7 days)
      ActivityLog.aggregate([
        { 
          $match: { 
            timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalLogs,
        topUsers: userStats,
        actionBreakdown: actionStats,
        topPages: pageStats,
        dailyActivity: dailyStats
      }
    });
  } catch (error) {
    console.error('❌ Error generating activity statistics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate statistics',
      error: error.message 
    });
  }
});

// Delete old logs (cleanup endpoint) (PROTECTED)
router.delete('/cleanup', authenticateAdmin, async (req, res) => {
  try {
    const { daysOld = 30 } = req.query;
    const cutoffDate = new Date(Date.now() - parseInt(daysOld) * 24 * 60 * 60 * 1000);
    
    console.log(`🗑️ Cleaning up activity logs older than ${daysOld} days`);
    
    const result = await ActivityLog.deleteMany({ 
      timestamp: { $lt: cutoffDate } 
    });
    
    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} old activity logs`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error cleaning up activity logs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cleanup logs',
      error: error.message 
    });
  }
});

module.exports = router;