const API_BASE_URL = 'http://localhost:8000/api';

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    bio?: string;
    avatar?: string | null;
    createdAt: string;
    updatedAt?: string;
}

export interface NotificationPreferences {
    emailNotifications: boolean;
    sessionReminders: boolean;
    weeklyReport: boolean;
}

export interface UpdateProfileData {
    name?: string;
    email?: string;
    bio?: string;
}

export interface ConnectedAccount {
    provider: string;
    email?: string;
    connectedAt: string;
}

/**
 * Get user profile information
 */
export async function getUserProfile(): Promise<UserProfile> {
    const { getAuthHeaders } = await import('@/lib/auth-headers');
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/dashboard/profile`, {
        method: 'GET',
        headers
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch profile');
    }

    const result = await response.json();
    return result.data;
}

/**
 * Update user profile information
 */
export async function updateProfile(profileData: UpdateProfileData): Promise<UserProfile> {
    const { getAuthHeaders } = await import('@/lib/auth-headers');
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/dashboard/profile`, {
        method: 'PUT',
        headers: {
            ...headers,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
    }

    const result = await response.json();
    return result.data;
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(file: File): Promise<{ avatarUrl: string; profile: UserProfile }> {
    const { getAuthHeaders } = await import('@/lib/auth-headers');
    const headers = await getAuthHeaders();

    // Remove Content-Type to let browser set it with multipart boundary
    const uploadHeaders = { ...headers };
    delete uploadHeaders['Content-Type'];
    delete uploadHeaders['content-type'];

    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_BASE_URL}/dashboard/profile/avatar`, {
        method: 'POST',
        headers: uploadHeaders,
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload avatar');
    }

    const result = await response.json();
    return result.data;
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
    const { getAuthHeaders } = await import('@/lib/auth-headers');
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/dashboard/profile/notifications`, {
        method: 'GET',
        headers
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch notification preferences');
    }

    const result = await response.json();
    return result.data;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
    preferences: NotificationPreferences
): Promise<NotificationPreferences> {
    const { getAuthHeaders } = await import('@/lib/auth-headers');
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/dashboard/profile/notifications`, {
        method: 'PUT',
        headers: {
            ...headers,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update notification preferences');
    }

    const result = await response.json();
    return result.data;
}

/**
 * Get connected OAuth accounts
 */
export async function getConnectedAccounts(): Promise<ConnectedAccount[]> {
    const { getAuthHeaders } = await import('@/lib/auth-headers');
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/dashboard/profile/connected-accounts`, {
        method: 'GET',
        headers
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch connected accounts');
    }

    const result = await response.json();
    return result.data;
}

/**
 * Export user data as JSON
 */
export async function exportUserData(): Promise<any> {
    const { getAuthHeaders } = await import('@/lib/auth-headers');
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/dashboard/profile/export`, {
        method: 'POST',
        headers
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to export user data');
    }

    const data = await response.json();
    return data;
}

/**
 * Delete user account
 */
export async function deleteUserAccount(): Promise<{ success: boolean; message: string }> {
    const { getAuthHeaders } = await import('@/lib/auth-headers');
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/dashboard/profile`, {
        method: 'DELETE',
        headers
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete account');
    }

    const result = await response.json();
    return result.data;
}

/**
 * Hard delete (permanently remove) user account
 */
export async function hardDeleteUserAccount(): Promise<{ success: boolean; message: string }> {
    const { getAuthHeaders } = await import('@/lib/auth-headers');
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/dashboard/profile/permanent`, {
        method: 'DELETE',
        headers
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to permanently delete account');
    }

    const result = await response.json();
    return result.data;
}

/**
 * Change user password
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const { getAuthHeaders } = await import('@/lib/auth-headers');
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/dashboard/profile/password`, {
        method: 'POST',
        headers: {
            ...headers,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
    }

    const result = await response.json();
    return result.data;
}

