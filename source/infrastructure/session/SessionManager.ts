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
	 * Get filename for session (sanitized)
	 */
	private getFilename(name: string): string {
		// Sanitize name
		const sanitized = name.replace(/[^a-zA-Z0-9-_]/g, '_');
		return `${sanitized}.json`;
	}
}
