/**
 * Utility functions
 */

import {UserService} from './UserService';
import {Calculator} from './Calculator';

/**
 * Format user display name
 */
export function formatUserName(name: string): string {
	return name.trim().toUpperCase();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Helper to create user service instance
 */
export function createUserService(): UserService {
	return new UserService();
}

/**
 * Helper to create calculator instance
 */
export function createCalculator(): Calculator {
	return new Calculator();
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
	if (total === 0) {
		return 0;
	}
	return (value / total) * 100;
}
