/**
 * Save Session Use Case
 * Saves current conversation session to persistent storage
 */

import {ISessionManager} from '../../domain/interfaces/ISessionManager';
import {Session} from '../../domain/models/Session';
import {Message} from '../../domain/models/Message';

export interface SaveSessionRequest {
	name: string;
	messages: Message[];
	model?: string;
	metadata?: Record<string, any>;
	overwrite?: boolean;
}

export interface SaveSessionResponse {
	sessionId: string;
	savedAt: Date;
	messageCount: number;
	success: boolean;
}

export class SaveSession {
	constructor(private sessionManager: ISessionManager) {}

	async execute(request: SaveSessionRequest): Promise<SaveSessionResponse> {
		const {name, messages, model, metadata = {}, overwrite = false} = request;

		// Validate session name
		if (!name || name.trim() === '') {
			throw new Error('Session name cannot be empty');
		}

		// Check if session already exists
		const existingSessions = await this.sessionManager.list();
		const sessionExists = existingSessions.some(s => s.name === name);

		if (sessionExists && !overwrite) {
			throw new Error(
				`Session "${name}" already exists. Set overwrite=true to replace it.`,
			);
		}

		// Create session
		const session = Session.create(name, messages, model || 'unknown');

		// Save session
		await this.sessionManager.save(session);

		return {
			sessionId: session.id,
			savedAt: session.createdAt,
			messageCount: messages.length,
			success: true,
		};
	}
}
