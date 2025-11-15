/**
 * In-Memory History Repository
 * For testing purposes or temporary storage
 */

import {
	IHistoryRepository,
	ConversationHistory,
} from '../../core/domain/interfaces/IHistoryRepository';
import {Message} from '../../core/domain/models/Message';
import {getLogger} from '../logging/Logger.js';

const logger = getLogger();

export class InMemoryHistoryRepository implements IHistoryRepository {
	private conversations: Map<string, ConversationHistory> = new Map();
	private currentConversationId?: string;

	async save(conversation: ConversationHistory): Promise<void> {
		logger.debug('InMemoryHistoryRepository', 'save', 'Saving conversation', {
			conversation_id: conversation.id,
			messages_count: conversation.messages.length,
		});

		this.conversations.set(conversation.id, {
			...conversation,
			updatedAt: new Date(),
		});
		this.currentConversationId = conversation.id;

		logger.debug('InMemoryHistoryRepository', 'save', 'Conversation saved', {
			total_conversations: this.conversations.size,
		});
	}

	async load(id: string): Promise<ConversationHistory | null> {
		logger.debug('InMemoryHistoryRepository', 'load', 'Loading conversation', {
			conversation_id: id,
		});

		const conversation = this.conversations.get(id) || null;

		logger.debug('InMemoryHistoryRepository', 'load', 'Load result', {
			found: !!conversation,
			messages_count: conversation?.messages.length,
		});

		return conversation;
	}

	async loadLatest(): Promise<ConversationHistory | null> {
		logger.debug('InMemoryHistoryRepository', 'loadLatest', 'Loading latest conversation', {
			total_conversations: this.conversations.size,
		});

		const conversations = Array.from(this.conversations.values());

		if (conversations.length === 0) {
			logger.debug('InMemoryHistoryRepository', 'loadLatest', 'No conversations found');
			return null;
		}

		// Sort by updatedAt descending
		conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

		const latest = conversations[0];
		logger.debug('InMemoryHistoryRepository', 'loadLatest', 'Latest conversation loaded', {
			conversation_id: latest.id,
			messages_count: latest.messages.length,
		});

		return latest;
	}

	async list(): Promise<ConversationHistory[]> {
		logger.debug('InMemoryHistoryRepository', 'list', 'Listing all conversations', {
			total_conversations: this.conversations.size,
		});
		return Array.from(this.conversations.values());
	}

	async delete(id: string): Promise<void> {
		logger.info('InMemoryHistoryRepository', 'delete', 'Deleting conversation', {
			conversation_id: id,
			is_current: this.currentConversationId === id,
		});

		this.conversations.delete(id);

		if (this.currentConversationId === id) {
			this.currentConversationId = undefined;
		}

		logger.debug('InMemoryHistoryRepository', 'delete', 'Conversation deleted', {
			remaining_conversations: this.conversations.size,
		});
	}

	async clear(): Promise<void> {
		logger.info('InMemoryHistoryRepository', 'clear', 'Clearing all conversations', {
			conversations_to_clear: this.conversations.size,
		});

		this.conversations.clear();
		this.currentConversationId = undefined;

		logger.debug('InMemoryHistoryRepository', 'clear', 'All conversations cleared');
	}

	async addMessage(message: Message): Promise<void> {
		logger.debug('InMemoryHistoryRepository', 'addMessage', 'Adding message', {
			message_role: message.role,
			has_current_conversation: !!this.currentConversationId,
		});

		let conversation: ConversationHistory;

		if (this.currentConversationId) {
			const existing = this.conversations.get(this.currentConversationId);
			if (existing) {
				conversation = {
					...existing,
					messages: [...existing.messages, message],
					updatedAt: new Date(),
				};
				logger.debug('InMemoryHistoryRepository', 'addMessage', 'Adding to existing conversation', {
					conversation_id: conversation.id,
					new_message_count: conversation.messages.length,
				});
			} else {
				conversation = this.createNewConversation([message]);
				logger.debug('InMemoryHistoryRepository', 'addMessage', 'Creating new conversation (existing not found)');
			}
		} else {
			conversation = this.createNewConversation([message]);
			logger.debug('InMemoryHistoryRepository', 'addMessage', 'Creating new conversation (no current)');
		}

		await this.save(conversation);
	}

	async getRecentMessages(limit: number): Promise<Message[]> {
		logger.debug('InMemoryHistoryRepository', 'getRecentMessages', 'Getting recent messages', {
			limit,
		});

		const latest = await this.loadLatest();

		if (!latest) {
			logger.debug('InMemoryHistoryRepository', 'getRecentMessages', 'No conversation found');
			return [];
		}

		const messages = latest.messages.slice(-limit);
		logger.debug('InMemoryHistoryRepository', 'getRecentMessages', 'Recent messages retrieved', {
			returned_count: messages.length,
			total_messages: latest.messages.length,
		});

		return messages;
	}

	private createNewConversation(messages: Message[]): ConversationHistory {
		logger.debug('InMemoryHistoryRepository', 'createNewConversation', 'Creating new conversation', {
			initial_messages: messages.length,
		});

		const now = new Date();
		const conversation: ConversationHistory = {
			id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			messages,
			createdAt: now,
			updatedAt: now,
			metadata: {},
		};

		logger.debug('InMemoryHistoryRepository', 'createNewConversation', 'New conversation created', {
			conversation_id: conversation.id,
		});

		return conversation;
	}

	// Utility methods
	getCurrentConversationId(): string | undefined {
		logger.debug('InMemoryHistoryRepository', 'getCurrentConversationId', 'Getting current conversation ID', {
			has_current: !!this.currentConversationId,
		});
		return this.currentConversationId;
	}

	async startNewConversation(): Promise<void> {
		logger.info('InMemoryHistoryRepository', 'startNewConversation', 'Starting new conversation');
		const conversation = this.createNewConversation([]);
		await this.save(conversation);
		logger.info('InMemoryHistoryRepository', 'startNewConversation', 'New conversation started', {
			conversation_id: conversation.id,
		});
	}
}
