/**
 * Timezone Utilities
 * Convert UTC timestamps to local timezone (IST) for display
 */

/**
 * Convert UTC timestamp to IST (Indian Standard Time)
 * @param utcTimestamp - ISO 8601 UTC timestamp string
 * @returns Formatted date string in IST
 */
export function convertToIST(utcTimestamp: string | Date): string {
    const date = typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp;

    // Convert to IST (UTC+5:30)
    return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Convert UTC timestamp to local timezone
 * @param utcTimestamp - ISO 8601 UTC timestamp string
 * @returns Formatted date string in user's local timezone
 */
export function convertToLocalTime(utcTimestamp: string | Date): string {
    const date = typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp;

    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 * @param utcTimestamp - ISO 8601 UTC timestamp string
 * @returns Relative time string
 */
export function getRelativeTime(utcTimestamp: string | Date): string {
    const date = typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffWeek < 4) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;
    if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
    return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
}

/**
 * Format date for session history
 * @param utcTimestamp - ISO 8601 UTC timestamp string
 * @returns Formatted date (e.g., "Jan 15, 2024 at 2:30 PM")
 */
export function formatSessionDate(utcTimestamp: string | Date): string {
    const date = typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp;

    return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}
