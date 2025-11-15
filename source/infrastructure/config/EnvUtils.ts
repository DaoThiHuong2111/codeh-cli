/**
 * Shared environment variable utilities
 *
 * This module provides common functions for reading and parsing
 * environment variables. Used by both EnvConfigRepository and Logger
 * to avoid code duplication.
 */

/**
 * Check if logging is enabled via CODEH_LOGGING env var
 * Accepts: true, TRUE, 1, yes (case-insensitive)
 */
export function isLoggingEnabled(): boolean {
	const value = process.env.CODEH_LOGGING;
	if (!value) {
		return false;
	}
	const lower = value.toLowerCase();
	return lower === 'true' || lower === '1' || lower === 'yes';
}

/**
 * Get environment variable value
 */
export function getEnv(key: string): string | undefined {
	return process.env[key];
}

/**
 * Parse integer from env var with default fallback
 */
export function getEnvInt(key: string, defaultValue: number): number {
	const value = process.env[key];
	if (!value) {
		return defaultValue;
	}
	const parsed = parseInt(value, 10);
	return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse float from env var with default fallback
 */
export function getEnvFloat(key: string, defaultValue: number): number {
	const value = process.env[key];
	if (!value) {
		return defaultValue;
	}
	const parsed = parseFloat(value);
	return isNaN(parsed) ? defaultValue : parsed;
}
