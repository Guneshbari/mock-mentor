/**
 * TypeScript Dashboard API Client
 * Handles all dashboard-related API calls with type safety
 */

export interface DashboardStats {
    totalSessions: number;
    averageScore: number;
    totalTime: number; // in minutes
    bestScore: number;
    recentTrend: number; // percentage change
}

export interface Session {
    id: string;
    type: string;
    role: string;
    difficulty: string;
    date: string;
    duration: string;
    score: number | null;
    questions: number;
    status: string;
}

export interface SessionHistoryResponse {
    sessions: Session[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    createdAt: string;
    preferences: {
        preferred_role?: string;
        experience_level?: string;
        interview_type?: string;
    };
    onboarding: {
        profile_types?: string[];
        experience_years?: string;
        goals?: string[];
    };
}

/**
 * Get dashboard statistics for the current user
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    const { getAuthHeaders } = await import('@/lib/auth-headers');
    const headers = await getAuthHeaders();

    const response = await fetch('http://localhost:8000/api/dashboard/stats', {
        method: 'GET',
        headers,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch dashboard statistics');
    }

    const data = await response.json();
    return data.data;
}

/**
 * Get session history with optional filters and pagination
 */
export async function getSessionHistory(options?: {
    limit?: number;
    offset?: number;
    sortBy?: 'date' | 'score';
    filterType?: string;
    search?: string;
}): Promise<SessionHistoryResponse> {
    const { getAuthHeaders } = await import('@/lib/auth-headers');
    const headers = await getAuthHeaders();

    // Build query string
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.sortBy) params.append('sortBy', options.sortBy);
    if (options?.filterType) params.append('filterType', options.filterType);
    if (options?.search) params.append('search', options.search);

    const queryString = params.toString();
    const url = `http://localhost:8000/api/dashboard/sessions${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch session history');
    }

    const data = await response.json();
    return {
        sessions: data.data,
        pagination: data.pagination,
    };
}

/**
 * Get user profile and preferences
 */
export async function getUserProfile(): Promise<UserProfile> {
    const { getAuthHeaders } = await import('@/lib/auth-headers');
    const headers = await getAuthHeaders();

    const response = await fetch('http://localhost:8000/api/dashboard/profile', {
        method: 'GET',
        headers,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch user profile');
    }

    const data = await response.json();
    return data.data;
}
