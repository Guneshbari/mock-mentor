const dashboardService = require('../services/dashboard.service');
const profileService = require('../services/profile.service');

/**
 * Dashboard Controller - Handle HTTP requests for dashboard data
 */

/**
 * Get user statistics for dashboard
 * GET /api/dashboard/stats
 */
async function getStatistics(req, res) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID not found in request'
            });
        }

        const stats = await dashboardService.getUserStatistics(userId);

        return res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error in getStatistics controller:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch user statistics'
        });
    }
}

/**
 * Get session history with pagination and filters
 * GET /api/dashboard/sessions
 * Query params: limit, offset, sortBy, filterType, search
 */
async function getSessionHistory(req, res) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID not found in request'
            });
        }

        // Extract query parameters
        const options = {
            limit: parseInt(req.query.limit) || 10,
            offset: parseInt(req.query.offset) || 0,
            sortBy: req.query.sortBy || 'date',
            filterType: req.query.filterType || null,
            search: req.query.search || null
        };

        const history = await dashboardService.getSessionHistory(userId, options);

        return res.status(200).json({
            success: true,
            data: history.sessions,
            pagination: {
                total: history.total,
                limit: history.limit,
                offset: history.offset,
                hasMore: history.offset + history.limit < history.total
            }
        });

    } catch (error) {
        console.error('Error in getSessionHistory controller:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch session history'
        });
    }
}

/**
 * Get user profile and preferences
 * GET /api/dashboard/profile
 */
async function getUserProfile(req, res) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID not found in request'
            });
        }

        const profile = await dashboardService.getUserProfile(userId);

        if (!profile) {
            return res.status(404).json({
                error: 'Not found',
                message: 'User profile not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: profile
        });

    } catch (error) {
        console.error('Error in getUserProfile controller:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch user profile'
        });
    }
}

/**
 * Update user profile information
 * PUT /api/dashboard/profile
 */
async function updateProfile(req, res) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID not found in request'
            });
        }

        const { name, email, bio } = req.body;

        const updatedProfile = await profileService.updateUserProfile(userId, {
            name,
            email,
            bio
        });

        return res.status(200).json({
            success: true,
            data: updatedProfile
        });

    } catch (error) {
        console.error('Error in updateProfile controller:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message || 'Failed to update profile'
        });
    }
}

/**
 * Upload user avatar
 * POST /api/dashboard/profile/avatar
 */
async function uploadAvatar(req, res) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID not found in request'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'No file uploaded'
            });
        }

        const result = await profileService.uploadAvatar(
            userId,
            req.file.buffer,
            req.file.mimetype,
            req.file.originalname
        );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error in uploadAvatar controller:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message || 'Failed to upload avatar'
        });
    }
}

/**
 * Get notification preferences
 * GET /api/dashboard/profile/notifications
 */
async function getNotificationPreferences(req, res) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID not found in request'
            });
        }

        const preferences = await profileService.getNotificationPreferences(userId);

        return res.status(200).json({
            success: true,
            data: preferences
        });

    } catch (error) {
        console.error('Error in getNotificationPreferences controller:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch notification preferences'
        });
    }
}

/**
 * Update notification preferences
 * PUT /api/dashboard/profile/notifications
 */
async function updateNotificationPreferences(req, res) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID not found in request'
            });
        }

        const { emailNotifications, sessionReminders, weeklyReport } = req.body;

        const updatedPreferences = await profileService.updateNotificationPreferences(userId, {
            emailNotifications,
            sessionReminders,
            weeklyReport
        });

        return res.status(200).json({
            success: true,
            data: updatedPreferences
        });

    } catch (error) {
        console.error('Error in updateNotificationPreferences controller:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update notification preferences'
        });
    }
}

/**
 * Export user data
 * POST /api/dashboard/profile/export
 */
async function exportData(req, res) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID not found in request'
            });
        }

        const exportedData = await profileService.exportUserData(userId);

        // Set headers for file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="mock-mentor-data-${userId}.json"`);

        return res.status(200).json(exportedData);

    } catch (error) {
        console.error('Error in exportData controller:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to export user data'
        });
    }
}

/**
 * Delete user account
 * DELETE /api/dashboard/profile
 */
async function deleteAccount(req, res) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID not found in request'
            });
        }

        const result = await profileService.deleteUserAccount(userId);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error in deleteAccount controller:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to delete account'
        });
    }
}

/**
 * Hard delete (permanent) user account
 * DELETE /api/dashboard/profile/permanent
 */
async function hardDeleteAccount(req, res) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID not found in request'
            });
        }

        const result = await profileService.hardDeleteUserAccount(userId);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error in hardDeleteAccount controller:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to permanently delete account'
        });
    }
}

/**
 * Get connected OAuth accounts
 * GET /api/dashboard/profile/connected-accounts
 */
async function getConnectedAccounts(req, res) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID not found in request'
            });
        }

        const accounts = await profileService.getConnectedAccounts(userId);

        return res.status(200).json({
            success: true,
            data: accounts
        });

    } catch (error) {
        console.error('Error in getConnectedAccounts controller:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch connected accounts'
        });
    }
}

/**
 * Change user password
 * POST /api/dashboard/profile/password
 */
const changePassword = async (req, res) => {
    try {
        const userId = req.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        const result = await profileService.changePassword(userId, currentPassword, newPassword);

        res.status(200).json({ message: 'Password changed successfully', data: result });
    } catch (error) {
        console.error('Error in changePassword controller:', error);
        res.status(500).json({ message: 'Failed to change password', error: error.message });
    }
};

/**
 * Get recent achievements
 * GET /api/dashboard/achievements
 */
async function getAchievements(req, res) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID not found in request'
            });
        }

        const limit = parseInt(req.query.limit) || 5;

        // Check and award any new achievements first
        await dashboardService.checkAndAwardAchievements(userId);

        // Get recent achievements
        const achievements = await dashboardService.getRecentAchievements(userId, limit);

        return res.status(200).json({
            success: true,
            data: achievements
        });

    } catch (error) {
        console.error('Error in getAchievements controller:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch achievements'
        });
    }
}

/**
 * Get random pro tips
 * GET /api/dashboard/pro-tips
 */
async function getProTips(req, res) {
    try {
        const count = parseInt(req.query.count) || 3;
        const category = req.query.category || null;

        const tips = await dashboardService.getRandomProTips(count, category);

        return res.status(200).json({
            success: true,
            data: tips
        });

    } catch (error) {
        console.error('Error in getProTips controller:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch pro tips'
        });
    }
}

/**
 * Get goals performance trend
 * GET /api/dashboard/goals/performance
 */
async function getGoalsPerformanceTrend(req, res) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID not found in request'
            });
        }

        const performanceData = await dashboardService.getGoalsPerformanceTrend(userId);

        return res.status(200).json({
            success: true,
            data: performanceData
        });

    } catch (error) {
        console.error('Error in getGoalsPerformanceTrend controller:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch goals performance data'
        });
    }
}

/**
 * Get detailed session information
 * GET /api/dashboard/sessions/:sessionId
 */
async function getSessionDetail(req, res) {
    try {
        const userId = req.userId;
        const sessionId = req.params.sessionId;

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID not found in request'
            });
        }

        if (!sessionId) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Session ID is required'
            });
        }

        const sessionDetail = await dashboardService.getSessionDetail(userId, sessionId);

        if (!sessionDetail) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Session not found or access denied'
            });
        }

        return res.status(200).json({
            success: true,
            data: sessionDetail
        });

    } catch (error) {
        console.error('Error in getSessionDetail controller:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch session details'
        });
    }
}

module.exports = {
    getStatistics,
    getSessionHistory,
    getSessionDetail,
    getUserProfile,
    updateProfile,
    uploadAvatar,
    getNotificationPreferences,
    updateNotificationPreferences,
    exportData,
    deleteAccount,
    hardDeleteAccount,
    getConnectedAccounts,
    changePassword,
    getAchievements,
    getProTips,
    getGoalsPerformanceTrend
};
