/**
 * Session Domain Model (Mutable Aggregate Root)
 * Represents a persistent conversation session with rich metadata
 *
 * Replaces both old Session (Value Object) and Conversation (Domain Model)
 * to be the single source of truth for message management.
 */

import type {Message} from './Message.js';
import {Message as MessageModel} from './Message.js';

export interface SessionMetadata {
	messageCount: number;
	totalTokens: number;
	estimatedCost: number;
	model: string;
	tags?: string[];
	/** Index of last compressed message (messages before this are compressed) */
	lastCompressedIndex?: number;
	/** ID of the compressed summary message */
	compressedMessageId?: string;
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
	name: string; // Mutable - can rename via withName()
	private messages: Message[] = [];
	private metadata: SessionMetadata;
	readonly createdAt: Date;
	updatedAt: Date; // Mutable - updated on changes
	/** Compressed summary message (if compression has occurred) */
	private compressedMessage?: Message;

	private constructor(data: SessionData) {
		this.id = data.id;
		this.name = data.name;
		this.messages = [...data.messages]; // Defensive copy
		this.metadata = {...data.metadata}; // Defensive copy
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
	}

	/**
	 * Create a new empty session
	 */
	static createNew(model: string, name?: string): Session {
		return new Session({
			id: this.generateId(),
			name: name || 'Untitled Session',
			messages: [],
			metadata: {
				messageCount: 0,
				totalTokens: 0,
				estimatedCost: 0,
				model,
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}

	/**
	 * Create a session from existing data (for saving)
	 */
	static create(name: string, messages: Message[], model: string): Session {
		const session = new Session({
			id: this.generateId(),
			name,
			messages,
			metadata: {
				messageCount: messages.length,
				totalTokens: 0, // Will be calculated
				estimatedCost: 0,
				model,
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Calculate metadata
		session.updateMetadata();
		return session;
	}

	/**
	 * Create from data (deserialization from file)
	 */
	static fromData(data: any): Session {
		// Reconstruct messages with proper Date objects
		const messages = (data.messages || []).map((msg: any) => 
			new MessageModel(
				msg.id,
				msg.role,
				msg.content,
				new Date(msg.timestamp), // Convert string to Date
				msg.toolCalls,
				msg.metadata
			)
		);
		
		return new Session({
			id: data.id,
			name: data.name,
			messages,
			metadata: data.metadata,
			createdAt: new Date(data.createdAt),
			updatedAt: new Date(data.updatedAt),
		});
	}

	// ============ Message Management (from Conversation) ============

	/**
	 * Add a message to the session
	 */
	addMessage(message: Message): void {
		this.messages.push(message);
		this.updatedAt = new Date();
		this.updateMetadata();
	}

	/**
	 * Get all messages (readonly)
	 */
	getMessages(): ReadonlyArray<Message> {
		return this.messages;
	}

	/**
	 * Get last message
	 */
	getLastMessage(): Message | undefined {
		return this.messages[this.messages.length - 1];
	}

	/**
	 * Get last N messages
	 */
	getLastNMessages(n: number): ReadonlyArray<Message> {
		return this.messages.slice(-n);
	}

	/**
	 * Get messages for sending to LLM (includes compressed message if exists)
	 * Returns: [compressedMessage?, ...uncompressedMessages]
	 */
	getMessagesForLLM(): ReadonlyArray<Message> {
		const lastCompressedIndex = this.metadata.lastCompressedIndex ?? -1;
		
		if (lastCompressedIndex >= 0 && this.compressedMessage) {
			// Return compressed message + messages after compression
			const uncompressedMessages = this.messages.slice(lastCompressedIndex + 1);
			return [this.compressedMessage, ...uncompressedMessages];
		}
		
		// No compression yet, return all messages
		return this.messages;
	}

	/**
	 * Set compressed message and mark messages as compressed
	 * @param compressedMessage The summary message
	 * @param compressedUpToIndex Index of last message that was compressed (inclusive)
	 */
	setCompressedMessage(compressedMessage: Message, compressedUpToIndex: number): void {
		this.compressedMessage = compressedMessage;
		this.metadata.lastCompressedIndex = compressedUpToIndex;
		this.metadata.compressedMessageId = compressedMessage.id;
		this.updatedAt = new Date();
	}

	/**
	 * Get compressed message if exists
	 */
	getCompressedMessage(): Message | undefined {
		return this.compressedMessage;
	}

	/**
	 * Check if session has compressed messages
	 */
	hasCompression(): boolean {
		return this.compressedMessage !== undefined;
	}

	/**
	 * Get message count
	 */
	getMessageCount(): number {
		return this.messages.length;
	}

	/**
	 * Get only user messages
	 */
	getUserMessages(): ReadonlyArray<Message> {
		return this.messages.filter(m => m.isUser());
	}

	/**
	 * Get only assistant messages
	 */
	getAssistantMessages(): ReadonlyArray<Message> {
		return this.messages.filter(m => m.isAssistant());
	}

	/**
	 * Clear all messages
	 */
	clear(): void {
		this.messages = [];
		this.updatedAt = new Date();
		this.updateMetadata();
	}

	// ============ Token & Cost Management ============

	/**
	 * Estimate token count (rough: 4 chars = 1 token)
	 */
	estimateTokenCount(): number {
		const totalChars = this.messages.reduce(
			(sum, msg) => sum + msg.content.length,
			0,
		);
		return Math.ceil(totalChars / 4);
	}

	/**
	 * Check if compression needed (>80% of max)
	 */
	needsCompression(maxTokens: number): boolean {
		return this.estimateTokenCount() > maxTokens * 0.8;
	}

	/**
	 * Get total tokens from metadata
	 */
	getTotalTokens(): number {
		return this.metadata.totalTokens;
	}

	/**
	 * Get estimated cost
	 */
	getEstimatedCost(): number {
		return this.metadata.estimatedCost;
	}

	/**
	 * Update metadata (recalculate counts, tokens, cost)
	 */
	updateMetadata(): void {
		// Calculate total tokens from message metadata
		const totalTokens = this.messages.reduce(
			(sum, msg) => sum + (msg.metadata?.usage?.totalTokens || 0),
			0,
		);

		// Calculate cost ($0.005 per 1K tokens)
		const estimatedCost = (totalTokens / 1000) * 0.005;

		this.metadata = {
			...this.metadata,
			messageCount: this.messages.length,
			totalTokens,
			estimatedCost,
		};
	}

	// ============ Session Management ============

	/**
	 * Create a copy with new name (for renaming)
	 */
	withName(newName: string): Session {
		return new Session({
			id: this.id,
			name: newName,
			messages: this.messages,
			metadata: this.metadata,
			createdAt: this.createdAt,
			updatedAt: new Date(),
		});
	}

	/**
	 * Get session metadata
	 */
	getMetadata(): Readonly<SessionMetadata> {
		return this.metadata;
	}

	// ============ Serialization ============

	/**
	 * Serialize to JSON (for saving to file)
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

	// ============ Private Utilities ============

	/**
	 * Generate unique session ID
	 */
	private static generateId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}
