/**
 * Time Formatting Utilities
 */

/**
 * Format a date as relative time (e.g., "2 hours ago", "yesterday")
 * @param date - The date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date): string {
	const now = new Date();
	const diff = now.getTime() - date.getTime();

	// Calculate time units
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	// Return appropriate format
	if (seconds < 60) {
		return seconds === 1 ? '1 second ago' : `${seconds} seconds ago`;
	}

	if (minutes < 60) {
		return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
	}

	if (hours < 24) {
		return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
	}

	if (days === 1) {
		return 'yesterday';
	}

	if (days < 7) {
		return `${days} days ago`;
	}

	if (days < 30) {
		const weeks = Math.floor(days / 7);
		return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
	}

	if (days < 365) {
		const months = Math.floor(days / 30);
		return months === 1 ? '1 month ago' : `${months} months ago`;
	}

	const years = Math.floor(days / 365);
	return years === 1 ? '1 year ago' : `${years} years ago`;
}

/**
 * Format a duration in seconds to human readable format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	if (hours > 0) {
		return `${hours}h ${minutes}m ${secs}s`;
	}

	if (minutes > 0) {
		return `${minutes}m ${secs}s`;
	}

	return `${secs}s`;
}
