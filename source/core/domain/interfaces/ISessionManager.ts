import {Session} from '../models/Session.js';

export interface SessionInfo {
	name: string;
	messageCount: number;
	createdAt: Date;
	updatedAt: Date;
	size: number; // File size in bytes
}

export interface ISessionManager {
	/**
	 * Initialize session manager (create directories, etc.)
	 */
	init(): Promise<void>;

	/**
	 * Save a session
	 */
	save(session: Session): Promise<void>;

	/**
	 * Save a session with auto-generated timestamp name
	 */
	saveWithTimestamp(session: Session): Promise<string>;

	/**
	 * Load a session by name
	 */
	load(name: string): Promise<Session>;

	/**
	 * List all saved sessions
	 */
	list(): Promise<SessionInfo[]>;

	/**
	 * Delete a session
	 */
	delete(name: string): Promise<void>;

	/**
	 * Check if session exists
	 */
	exists(name: string): Promise<boolean>;
}
