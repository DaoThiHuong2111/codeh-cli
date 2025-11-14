import * as fs from 'fs/promises';
import * as path from 'path';
import {homedir} from 'os';
import type {
	ISessionManager,
	SessionInfo,
} from '../../core/domain/interfaces/ISessionManager.js';
import {Session} from '../../core/domain/models/Session.js';

export class FileSessionManager implements ISessionManager {
	private sessionsDir: string;

	constructor(baseDir?: string) {
		this.sessionsDir = baseDir || path.join(homedir(), '.codeh', 'sessions');
	}

	async init(): Promise<void> {
		try {
			await fs.mkdir(this.sessionsDir, {recursive: true});
		} catch (error) {
			// Directory might already exist
		}
	}

	async save(session: Session): Promise<void> {
		await this.init();

		const filename = this.getFilename(session.name);
		const filepath = path.join(this.sessionsDir, filename);

		// Serialize session
		const data = JSON.stringify(session.toJSON(), null, 2);

		// Write to file
		await fs.writeFile(filepath, data, 'utf-8');
	}

	async load(name: string): Promise<Session> {
		const filename = this.getFilename(name);
		const filepath = path.join(this.sessionsDir, filename);

		// Check if exists
		if (!(await this.exists(name))) {
			throw new Error(`Session "${name}" not found`);
		}

		// Read file
		const data = await fs.readFile(filepath, 'utf-8');

		// Parse and create session
		const json = JSON.parse(data);
		return Session.fromData(json);
	}

	async list(): Promise<SessionInfo[]> {
		await this.init();

		try {
			// Read directory
			const files = await fs.readdir(this.sessionsDir);

			// Filter .json files
			const sessionFiles = files.filter(f => f.endsWith('.json'));

			// Get info for each
			const infos: SessionInfo[] = [];

			for (const file of sessionFiles) {
				const filepath = path.join(this.sessionsDir, file);
				const stats = await fs.stat(filepath);

				// Read file to get metadata
				const data = await fs.readFile(filepath, 'utf-8');
				const json = JSON.parse(data);

				infos.push({
					name: json.name,
					messageCount: json.metadata.messageCount,
					createdAt: new Date(json.createdAt),
					updatedAt: new Date(json.updatedAt),
					size: stats.size,
				});
			}

			// Sort by updated date (newest first)
			infos.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

			return infos;
		} catch (error) {
			// Directory might not exist yet
			return [];
		}
	}

	async delete(name: string): Promise<void> {
		const filename = this.getFilename(name);
		const filepath = path.join(this.sessionsDir, filename);

		if (!(await this.exists(name))) {
			throw new Error(`Session "${name}" not found`);
		}

		await fs.unlink(filepath);
	}

	async exists(name: string): Promise<boolean> {
		const filename = this.getFilename(name);
		const filepath = path.join(this.sessionsDir, filename);

		try {
			await fs.access(filepath);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Save session with auto-generated timestamp name
	 * @returns The generated session name
	 */
	async saveWithTimestamp(session: Session): Promise<string> {
		// Generate timestamp name: session_YYYYMMDD_HHMMSS
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');
		const seconds = String(now.getSeconds()).padStart(2, '0');

		const timestampName = `session_${year}${month}${day}_${hours}${minutes}${seconds}`;

		// Create new session with timestamp name
		const namedSession = session.withName(timestampName);

		// Save it
		await this.save(namedSession);

		return timestampName;
	}

	/**
	 * Get the latest (most recently updated) session
	 * @returns The latest session or null if no sessions exist
	 */
	async getLatest(): Promise<Session | null> {
		const sessions = await this.list();

		if (sessions.length === 0) {
			return null;
		}

		// List already sorted by updatedAt descending (newest first)
		const latestInfo = sessions[0];

		// Load the session
		return await this.load(latestInfo.name);
	}

	/**
	 * Get filename for session (sanitized)
	 */
	private getFilename(name: string): string {
		// Sanitize name
		const sanitized = name.replace(/[^a-zA-Z0-9-_]/g, '_');
		return `${sanitized}.json`;
	}
}
