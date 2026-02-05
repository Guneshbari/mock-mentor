const express = require('express');
const router = express.Router();
const multer = require('multer');
const dashboardController = require('../controllers/dashboard.controller');
const extractUser = require('../middleware/auth.middleware');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit
    }
});

// Apply auth middleware to all dashboard routes
router.use(extractUser);

// GET /api/dashboard/stats - Get user statistics
router.get('/stats', dashboardController.getStatistics);

// GET /api/dashboard/sessions - Get session history with pagination
router.get('/sessions', dashboardController.getSessionHistory);

// GET /api/dashboard/profile - Get user profile and preferences
router.get('/profile', dashboardController.getUserProfile);

// PUT /api/dashboard/profile - Update user profile
router.put('/profile', dashboardController.updateProfile);

// POST /api/dashboard/profile/avatar - Upload user avatar
router.post('/profile/avatar', upload.single('avatar'), dashboardController.uploadAvatar);

// GET /api/dashboard/profile/notifications - Get notification preferences
router.get('/profile/notifications', dashboardController.getNotificationPreferences);

// PUT /api/dashboard/profile/notifications - Update notification preferences
router.put('/profile/notifications', dashboardController.updateNotificationPreferences);

// GET /api/dashboard/profile/connected-accounts - Get connected OAuth accounts
router.get('/profile/connected-accounts', dashboardController.getConnectedAccounts);

// POST /api/dashboard/profile/password - Change user password
router.post('/profile/password', dashboardController.changePassword);

// POST /api/dashboard/profile/export - Export user data
router.post('/profile/export', dashboardController.exportData);

// DELETE /api/dashboard/profile - Delete user account
router.delete('/profile', dashboardController.deleteAccount);

// DELETE /api/dashboard/profile/permanent - Hard delete user account
router.delete('/profile/permanent', dashboardController.hardDeleteAccount);

// GET /api/dashboard/achievements - Get recent achievements
router.get('/achievements', dashboardController.getAchievements);

// GET /api/dashboard/pro-tips - Get random pro tips
router.get('/pro-tips', dashboardController.getProTips);

// GET /api/dashboard/goals/performance - Get goals performance trend
router.get('/goals/performance', dashboardController.getGoalsPerformanceTrend);

module.exports = router;
