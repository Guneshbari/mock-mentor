const supabase = require('./supabase');

/**
 * Profile Service - Manage user profile, preferences, and account settings
 */

/**
 * Update user profile information
 * @param {string} userId - User UUID
 * @param {object} profileData - Profile data to update
 * @param {string} profileData.name - User's full name
 * @param {string} profileData.email - User's email
 * @param {string} profileData.bio - User's bio
 * @returns {Promise<object>} Updated profile
 */
async function updateUserProfile(userId, profileData) {
    if (!supabase) {
        console.warn('Supabase not configured. Cannot update profile.');
        return null;
    }

    try {
        const updateData = {};

        if (profileData.name !== undefined) {
            updateData.name = profileData.name;
        }
        if (profileData.email !== undefined) {
            updateData.email = profileData.email;
        }
        if (profileData.bio !== undefined) {
            updateData.bio = profileData.bio;
        }

        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }

        console.log(`Profile updated for user ${userId}`);
        return {
            id: data.id,
            email: data.email,
            name: data.name || '',
            bio: data.bio || '',
            avatar: data.profile_image_url || null,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };

    } catch (error) {
        console.error('Failed to update user profile:', error);
        throw error;
    }
}

/**
 * Upload or update user avatar
 * @param {string} userId - User UUID
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} mimeType - File MIME type
 * @param {string} fileName - Original file name
 * @returns {Promise<object>} Updated profile with new avatar URL
 */
async function uploadAvatar(userId, fileBuffer, mimeType, fileName) {
    if (!supabase) {
        console.warn('Supabase not configured. Cannot upload avatar.');
        return null;
    }

    try {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(mimeType.toLowerCase())) {
            throw new Error('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.');
        }

        // Validate file size (max 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB in bytes
        if (fileBuffer.length > maxSize) {
            throw new Error('File too large. Maximum size is 2MB.');
        }

        // Generate unique filename
        const fileExt = fileName.split('.').pop();
        const uniqueFileName = `${userId}_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${uniqueFileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('user-uploads')
            .upload(filePath, fileBuffer, {
                contentType: mimeType,
                upsert: true
            });

        if (uploadError) {
            console.error('Error uploading avatar:', uploadError);
            throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('user-uploads')
            .getPublicUrl(filePath);

        const avatarUrl = urlData.publicUrl;

        // Update user profile with new avatar URL
        const { data: userData, error: updateError } = await supabase
            .from('users')
            .update({
                profile_image_url: avatarUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating profile with avatar URL:', updateError);
            throw updateError;
        }

        console.log(`Avatar uploaded for user ${userId}`);
        return {
            avatarUrl,
            profile: {
                id: userData.id,
                email: userData.email,
                name: userData.name || '',
                bio: userData.bio || '',
                avatar: userData.profile_image_url,
                updatedAt: userData.updated_at
            }
        };

    } catch (error) {
        console.error('Failed to upload avatar:', error);
        throw error;
    }
}

/**
 * Get user notification preferences
 * @param {string} userId - User UUID
 * @returns {Promise<object>} Notification preferences
 */
async function getNotificationPreferences(userId) {
    if (!supabase) {
        console.warn('Supabase not configured. Returning default preferences.');
        return {
            emailNotifications: true,
            sessionReminders: true,
            weeklyReport: false
        };
    }

    try {
        const { data, error } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching notification preferences:', error);
            throw error;
        }

        // Return default if no preferences found
        if (!data) {
            return {
                emailNotifications: true,
                sessionReminders: true,
                weeklyReport: false
            };
        }

        return {
            emailNotifications: data.email_notifications,
            sessionReminders: data.session_reminders,
            weeklyReport: data.weekly_report
        };

    } catch (error) {
        console.error('Failed to fetch notification preferences:', error);
        throw error;
    }
}

/**
 * Update user notification preferences
 * @param {string} userId - User UUID
 * @param {object} preferences - Notification preferences
 * @param {boolean} preferences.emailNotifications - Email notifications enabled
 * @param {boolean} preferences.sessionReminders - Session reminders enabled
 * @param {boolean} preferences.weeklyReport - Weekly report enabled
 * @returns {Promise<object>} Updated preferences
 */
async function updateNotificationPreferences(userId, preferences) {
    if (!supabase) {
        console.warn('Supabase not configured. Cannot update preferences.');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('notification_preferences')
            .upsert({
                user_id: userId,
                email_notifications: preferences.emailNotifications ?? true,
                session_reminders: preferences.sessionReminders ?? true,
                weekly_report: preferences.weeklyReport ?? false,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'  // Specify which column to check for conflicts
            })
            .select()
            .single();

        if (error) {
            console.error('Error updating notification preferences:', error);
            throw error;
        }

        console.log(`Notification preferences updated for user ${userId}`);
        return {
            emailNotifications: data.email_notifications,
            sessionReminders: data.session_reminders,
            weeklyReport: data.weekly_report
        };

    } catch (error) {
        console.error('Failed to update notification preferences:', error);
        throw error;
    }
}

/**
 * Export all user data as JSON
 * @param {string} userId - User UUID
 * @returns {Promise<object>} Complete user data export
 */
async function exportUserData(userId) {
    if (!supabase) {
        console.warn('Supabase not configured. Cannot export data.');
        return null;
    }

    try {
        // Get user profile
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('Error fetching user for export:', userError);
            throw userError;
        }

        // Get user preferences
        const { data: preferences } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        // Get notification preferences
        const { data: notificationPrefs } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        // Get all sessions
        const { data: sessions } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', userId)
            .order('started_at', { ascending: false });

        // Get session questions and responses
        let sessionDetails = [];
        if (sessions && sessions.length > 0) {
            const sessionIds = sessions.map(s => s.id);

            const { data: questions } = await supabase
                .from('session_questions')
                .select('*')
                .in('session_id', sessionIds);

            const { data: responses } = await supabase
                .from('responses')
                .select('*')
                .in('session_id', sessionIds);

            const { data: feedback } = await supabase
                .from('feedback')
                .select('*')
                .in('session_id', sessionIds);

            sessionDetails = sessions.map(session => ({
                ...session,
                questions: questions?.filter(q => q.session_id === session.id) || [],
                responses: responses?.filter(r => r.session_id === session.id) || [],
                feedback: feedback?.filter(f => f.session_id === session.id) || []
            }));
        }

        const exportData = {
            exportDate: new Date().toISOString(),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                bio: user.bio,
                profileImageUrl: user.profile_image_url,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            },
            preferences: preferences || {},
            notificationPreferences: notificationPrefs || {},
            sessions: sessionDetails,
            statistics: {
                totalSessions: sessions?.length || 0,
                totalQuestions: sessionDetails.reduce((sum, s) => sum + s.questions.length, 0),
                totalResponses: sessionDetails.reduce((sum, s) => sum + s.responses.length, 0)
            }
        };

        console.log(`Data exported for user ${userId}`);
        return exportData;

    } catch (error) {
        console.error('Failed to export user data:', error);
        throw error;
    }
}

/**
 * Soft delete user account
 * @param {string} userId - User UUID
 * @returns {Promise<object>} Result of deletion
 */
async function deleteUserAccount(userId) {
    if (!supabase) {
        console.warn('Supabase not configured. Cannot delete account.');
        return null;
    }

    try {
        // Soft delete: mark user as deleted
        const { data, error } = await supabase
            .from('users')
            .update({
                deleted_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error deleting user account:', error);
            throw error;
        }

        console.log(`Account soft deleted for user ${userId}`);
        return {
            success: true,
            deletedAt: data.deleted_at,
            message: 'Account marked for deletion. You have 30 days to recover your account.'
        };

    } catch (error) {
        console.error('Failed to delete user account:', error);
        throw error;
    }
}

/**
 * Hard delete (permanently remove) user account
 * @param {string} userId - User UUID
 * @returns {Promise<object>} Result of deletion
 */
async function hardDeleteUserAccount(userId) {
    if (!supabase) {
        console.warn('Supabase not configured. Cannot delete account.');
        return null;
    }

    try {
        // 1. Delete user from Supabase Auth (admin API)
        // This should cascade to public.users if configured, but we'll manually ensure data hygiene
        // Note: Using admin API to delete user from auth.users
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);

        if (authError) {
            console.error('Error deleting user from Auth:', authError);
            throw authError;
        }

        // 2. Ideally, we should also delete from public.users if CASCADE isn't set up
        // But assumedly, auth.users -> public.users has ON DELETE CASCADE
        // If not, we would explicitly delete from public.users here:
        // const { error: dbError } = await supabase.from('users').delete().eq('id', userId);

        console.log(`Account permanently deleted for user ${userId}`);
        return {
            success: true,
            message: 'Account permanently deleted.'
        };

    } catch (error) {
        console.error('Failed to permanently delete user account:', error);
        throw error;
    }
}

/**
 * Change user password
 * @param {string} userId - User UUID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<object>} Result of password change
 */
async function changePassword(userId, currentPassword, newPassword) {
    if (!supabase) {
        console.warn('Supabase not configured. Cannot change password.');
        return null;
    }

    try {
        // Validate new password strength
        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        // Update password using Supabase Auth
        // Note: This requires the user's access token, which should be passed from the client
        // For now, we'll use the admin API to update the password
        const { data, error } = await supabase.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (error) {
            console.error('Error changing password:', error);
            throw error;
        }

        console.log(`Password changed for user ${userId}`);
        return {
            success: true,
            message: 'Password updated successfully'
        };

    } catch (error) {
        console.error('Failed to change password:', error);
        throw error;
    }
}

/**
 * Get connected OAuth accounts
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} List of connected OAuth providers
 */
async function getConnectedAccounts(userId) {
    if (!supabase) {
        console.warn('Supabase not configured. Cannot fetch connected accounts.');
        return [];
    }

    try {
        // Get user with identities from Supabase Auth
        const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);

        if (error) {
            console.error('Error fetching user identities:', error);
            throw error;
        }

        if (!user || !user.identities) {
            return [];
        }

        // Map identities to friendly format
        const connectedAccounts = user.identities.map(identity => ({
            provider: identity.provider,
            email: identity.identity_data?.email || user.email,
            connectedAt: identity.created_at,
            lastUsed: identity.last_sign_in_at
        }));

        console.log(`Fetched ${connectedAccounts.length} connected accounts for user ${userId}`);
        return connectedAccounts;

    } catch (error) {
        console.error('Failed to fetch connected accounts:', error);
        throw error;
    }
}

module.exports = {
    updateUserProfile,
    uploadAvatar,
    getNotificationPreferences,
    updateNotificationPreferences,
    exportUserData,
    deleteUserAccount,
    hardDeleteUserAccount,
    getConnectedAccounts,
    changePassword
};
