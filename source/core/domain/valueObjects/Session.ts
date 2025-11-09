import type {Message} from '../models/Message.js';

export interface SessionMetadata {
	messageCount: number;
	totalTokens: number;
	estimatedCost: number;
	model: string;
	tags?: string[];
}

export interface SessionData {
	id: string;
	name: string;
	messages: Message[];
	metadata: SessionMetadata;
	createdAt: Date;
	updatedAt: Date;
}

export class Session {
	readonly id: string;
	readonly name: string;
	readonly messages: Message[];
	readonly metadata: SessionMetadata;
	readonly createdAt: Date;
	readonly updatedAt: Date;

	private constructor(data: SessionData) {
		this.id = data.id;
		this.name = data.name;
		this.messages = data.messages;
		this.metadata = data.metadata;
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
	}

	/**
	 * Create a new session
	 */
	static create(name: string, messages: Message[], model: string): Session {
		const totalTokens = messages.reduce(
			(sum, msg) => sum + (msg.metadata?.usage?.totalTokens || 0),
			0,
		);

		const estimatedCost = (totalTokens / 1000) * 0.005;

		return new Session({
			id: this.generateId(),
			name,
			messages,
			metadata: {
				messageCount: messages.length,
				totalTokens,
				estimatedCost,
				model,
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}

	/**
	 * Create from data (deserialization)
	 */
	static fromData(data: any): Session {
		return new Session({
			id: data.id,
			name: data.name,
			messages: data.messages,
			metadata: data.metadata,
			createdAt: new Date(data.createdAt),
			updatedAt: new Date(data.updatedAt),
		});
	}

	/**
	 * Get message count
	 */
	getMessageCount(): number {
		return this.messages.length;
	}

	/**
	 * Get total tokens
	 */
	getTotalTokens(): number {
		return this.metadata.totalTokens;
	}

	/**
	 * Serialize to JSON
	 */
	toJSON(): SessionData {
		return {
			id: this.id,
			name: this.name,
			messages: this.messages,
			metadata: this.metadata,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}

	/**
	 * Generate unique ID
	 */
	private static generateId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}
