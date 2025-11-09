/**
 * In-Memory History Repository
 * For testing purposes or temporary storage
 */

import {
	IHistoryRepository,
	ConversationHistory,
} from '../../core/domain/interfaces/IHistoryRepository';
import {Message} from '../../core/domain/models/Message';

export class InMemoryHistoryRepository implements IHistoryRepository {
	private conversations: Map<string, ConversationHistory> = new Map();
	private currentConversationId?: string;

	async save(conversation: ConversationHistory): Promise<void> {
		this.conversations.set(conversation.id, {
			...conversation,
			updatedAt: new Date(),
		});
		this.currentConversationId = conversation.id;
	}

	async load(id: string): Promise<ConversationHistory | null> {
		return this.conversations.get(id) || null;
	}

	async loadLatest(): Promise<ConversationHistory | null> {
		const conversations = Array.from(this.conversations.values());

		if (conversations.length === 0) {
			return null;
		}

		// Sort by updatedAt descending
		conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

		return conversations[0];
	}

	async list(): Promise<ConversationHistory[]> {
		return Array.from(this.conversations.values());
	}

	async delete(id: string): Promise<void> {
		this.conversations.delete(id);

		if (this.currentConversationId === id) {
			this.currentConversationId = undefined;
		}
	}

	async clear(): Promise<void> {
		this.conversations.clear();
		this.currentConversationId = undefined;
	}

	async addMessage(message: Message): Promise<void> {
		let conversation: ConversationHistory;

		if (this.currentConversationId) {
			const existing = this.conversations.get(this.currentConversationId);
			if (existing) {
				conversation = {
					...existing,
					messages: [...existing.messages, message],
					updatedAt: new Date(),
				};
			} else {
				conversation = this.createNewConversation([message]);
			}
		} else {
			conversation = this.createNewConversation([message]);
		}

		await this.save(conversation);
	}

	async getRecentMessages(limit: number): Promise<Message[]> {
		const latest = await this.loadLatest();

		if (!latest) {
			return [];
		}

		return latest.messages.slice(-limit);
	}

	private createNewConversation(messages: Message[]): ConversationHistory {
		const now = new Date();
		return {
			id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			messages,
			createdAt: now,
			updatedAt: now,
			metadata: {},
		};
	}

	// Utility methods
	getCurrentConversationId(): string | undefined {
		return this.currentConversationId;
	}

	async startNewConversation(): Promise<void> {
		const conversation = this.createNewConversation([]);
		await this.save(conversation);
	}
}
