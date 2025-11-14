/**
 * Load Session Use Case
 * Loads a saved conversation session from persistent storage
 */

import {ISessionManager} from '../../domain/interfaces/ISessionManager';
import {Session, SessionMetadata} from '../../domain/models/Session';
import {Message} from '../../domain/models/Message';

export interface LoadSessionRequest {
	name: string;
}

export interface LoadSessionResponse {
	session: Session;
	messages: Message[];
	model?: string;
	metadata?: SessionMetadata;
	loadedAt: Date;
}

export class LoadSession {
	constructor(private sessionManager: ISessionManager) {}

	async execute(request: LoadSessionRequest): Promise<LoadSessionResponse> {
		const {name} = request;

		// Validate session name
		if (!name || name.trim() === '') {
			throw new Error('Session name cannot be empty');
		}

		// Load session
		const session = await this.sessionManager.load(name);

		if (!session) {
			throw new Error(`Session "${name}" not found`);
		}

		return {
			session,
			messages: Array.from(session.getMessages()),
			model: session.getMetadata().model,
			metadata: session.getMetadata(),
			loadedAt: new Date(),
		};
	}

	/**
	 * List all available sessions
	 */
	async listSessions(): Promise<
		Array<{
			name: string;
			messageCount: number;
			createdAt: Date;
			updatedAt: Date;
		}>
	> {
		const sessions = await this.sessionManager.list();

		return sessions.map(s => ({
			name: s.name,
			messageCount: s.messageCount,
			createdAt: s.createdAt,
			updatedAt: s.updatedAt,
		}));
	}

	/**
	 * Delete a session
	 */
	async deleteSession(name: string): Promise<void> {
		if (!name || name.trim() === '') {
			throw new Error('Session name cannot be empty');
		}

		const exists = await this.sessionManager.exists(name);
		if (!exists) {
			throw new Error(`Session "${name}" not found`);
		}

		await this.sessionManager.delete(name);
	}
}
