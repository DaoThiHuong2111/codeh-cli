/**
 * Message Domain Model
 * Represents a single message in a conversation
 */

import {ToolCall} from '../interfaces/IApiClient';

export type MessageRole = 'user' | 'assistant' | 'system' | 'error';

export class Message {
	constructor(
		public readonly id: string,
		public readonly role: MessageRole,
		public readonly content: string,
		public readonly timestamp: Date,
		public readonly toolCalls?: ToolCall[],
		public readonly metadata?: Record<string, any>,
	) {}

	static create(
		role: MessageRole,
		content: string,
		options?: {
			toolCalls?: ToolCall[];
			metadata?: Record<string, any>;
		},
	): Message {
		return new Message(
			this.generateId(),
			role,
			content,
			new Date(),
			options?.toolCalls,
			options?.metadata,
		);
	}

	static user(content: string): Message {
		return this.create('user', content);
	}

	static assistant(content: string, toolCalls?: ToolCall[]): Message {
		return this.create('assistant', content, {toolCalls});
	}

	static system(content: string): Message {
		return this.create('system', content);
	}

	static error(error: Error | string): Message {
		const content = typeof error === 'string' ? error : error.message;
		return this.create('error', content);
	}

	private static generateId(): string {
		return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	hasToolCalls(): boolean {
		return !!this.toolCalls && this.toolCalls.length > 0;
	}

	isUser(): boolean {
		return this.role === 'user';
	}

	isAssistant(): boolean {
		return this.role === 'assistant';
	}

	isSystem(): boolean {
		return this.role === 'system';
	}

	toJSON(): object {
		return {
			id: this.id,
			role: this.role,
			content: this.content,
			timestamp: this.timestamp.toISOString(),
			toolCalls: this.toolCalls,
			metadata: this.metadata,
		};
	}
}
