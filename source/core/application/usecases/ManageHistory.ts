/**
 * Manage History Use Case
 * Handles conversation history operations
 */

import {IHistoryRepository} from '../../domain/interfaces/IHistoryRepository';
import {Message} from '../../domain/models/Message';

export interface AddMessagesRequest {
	messages: Message[];
	conversationId?: string;
}

export interface GetHistoryRequest {
	limit?: number;
	offset?: number;
	conversationId?: string;
}

export interface ClearHistoryRequest {
	conversationId?: string;
	beforeDate?: Date;
}

export interface SearchHistoryRequest {
	query: string;
	limit?: number;
	conversationId?: string;
}

export class ManageHistory {
	constructor(private historyRepo: IHistoryRepository) {}

	/**
	 * Add messages to history
	 */
	async addMessages(request: AddMessagesRequest): Promise<void> {
		const {messages} = request;

		for (const message of messages) {
			await this.historyRepo.addMessage(message);
		}
	}

	/**
	 * Get recent messages
	 */
	async getRecentMessages(request: GetHistoryRequest): Promise<Message[]> {
		const {limit = 10} = request;
		return await this.historyRepo.getRecentMessages(limit);
	}

	/**
	 * Get all messages
	 */
	async getAllMessages(): Promise<Message[]> {
		// Get all conversations and extract messages
		const conversations = await this.historyRepo.list();
		const allMessages: Message[] = [];

		for (const conv of conversations) {
			allMessages.push(...conv.messages);
		}

		// Sort by timestamp
		return allMessages.sort(
			(a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
		);
	}

	/**
	 * Clear history
	 */
	async clearHistory(request: ClearHistoryRequest = {}): Promise<void> {
		const {beforeDate} = request;

		if (beforeDate) {
			// Clear messages before specific date - not supported in current interface
			// Would need to implement partial clear in repository
			throw new Error('Clearing by date is not currently supported');
		} else {
			// Clear all
			await this.historyRepo.clear();
		}
	}

	/**
	 * Search messages by content
	 */
	async searchMessages(request: SearchHistoryRequest): Promise<Message[]> {
		const {query, limit = 50} = request;

		const allMessages = await this.getAllMessages();

		// Simple text search (case-insensitive)
		const results = allMessages.filter((m: Message) =>
			m.content.toLowerCase().includes(query.toLowerCase()),
		);

		// Return limited results
		return results.slice(0, limit);
	}

	/**
	 * Get messages count
	 */
	async getMessageCount(): Promise<number> {
		const messages = await this.getAllMessages();
		return messages.length;
	}

	/**
	 * Get history statistics
	 */
	async getStatistics(): Promise<{
		totalMessages: number;
		userMessages: number;
		assistantMessages: number;
		firstMessageDate?: Date;
		lastMessageDate?: Date;
	}> {
		const messages = await this.getAllMessages();

		return {
			totalMessages: messages.length,
			userMessages: messages.filter((m: Message) => m.isUser()).length,
			assistantMessages: messages.filter((m: Message) => m.isAssistant())
				.length,
			firstMessageDate: messages.length > 0 ? messages[0].timestamp : undefined,
			lastMessageDate:
				messages.length > 0
					? messages[messages.length - 1].timestamp
					: undefined,
		};
	}
}
