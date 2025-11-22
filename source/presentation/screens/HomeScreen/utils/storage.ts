/**
 * File-based storage utilities for chat history persistence
 * Uses JSON files in user's home directory
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type {HistoryItem} from '../types';

/**
 * Get storage directory path
 */
function getStorageDir(): string {
	const homeDir = os.homedir();
	const storageDir = path.join(homeDir, '.codeh-cli', 'chat-history');

	if (!fs.existsSync(storageDir)) {
		fs.mkdirSync(storageDir, {recursive: true});
	}

	return storageDir;
}

/**
 * Get storage file path for a given storage key
 */
function getStorageFilePath(storageKey: string): string {
	const storageDir = getStorageDir();
	return path.join(storageDir, `${storageKey}.json`);
}

/**
 * Save history to file
 */
export function saveHistoryToFile(
	storageKey: string,
	history: HistoryItem[],
): void {
	try {
		const filePath = getStorageFilePath(storageKey);

		const data = JSON.stringify(
			history.map(item => ({
				...item,
				timestamp: item.timestamp.toISOString(),
			})),
			null,
			2,
		);

		fs.writeFileSync(filePath, data, 'utf-8');
	} catch (error) {
		console.error('Failed to save history to file:', error);
	}
}

/**
 * Load history from file
 */
export function loadHistoryFromFile(storageKey: string): HistoryItem[] {
	try {
		const filePath = getStorageFilePath(storageKey);

		if (!fs.existsSync(filePath)) {
			return [];
		}

		const data = fs.readFileSync(filePath, 'utf-8');
		const parsed = JSON.parse(data);

		return parsed.map((item: any) => ({
			...item,
			timestamp: new Date(item.timestamp),
		}));
	} catch (error) {
		console.error('Failed to load history from file:', error);
		return [];
	}
}

/**
 * Clear history file
 */
export function clearHistoryFile(storageKey: string): void {
	try {
		const filePath = getStorageFilePath(storageKey);

		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
	} catch (error) {
		console.error('Failed to clear history file:', error);
	}
}

/**
 * List all history files
 */
export function listHistoryFiles(): string[] {
	try {
		const storageDir = getStorageDir();

		if (!fs.existsSync(storageDir)) {
			return [];
		}

		return fs
			.readdirSync(storageDir)
			.filter(file => file.endsWith('.json'))
			.map(file => file.replace('.json', ''));
	} catch (error) {
		console.error('Failed to list history files:', error);
		return [];
	}
}

/**
 * Get history file info
 */
export function getHistoryFileInfo(storageKey: string): {
	exists: boolean;
	size: number;
	itemCount: number;
	lastModified: Date | null;
} {
	try {
		const filePath = getStorageFilePath(storageKey);

		if (!fs.existsSync(filePath)) {
			return {
				exists: false,
				size: 0,
				itemCount: 0,
				lastModified: null,
			};
		}

		const stats = fs.statSync(filePath);
		const history = loadHistoryFromFile(storageKey);

		return {
			exists: true,
			size: stats.size,
			itemCount: history.length,
			lastModified: stats.mtime,
		};
	} catch (error) {
		console.error('Failed to get history file info:', error);
		return {
			exists: false,
			size: 0,
			itemCount: 0,
			lastModified: null,
		};
	}
}
