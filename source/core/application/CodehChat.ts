/**
 * Codeh Chat - Conversation Manager
 * Manages conversation flow and context
 */

// Conversation has been replaced by Session
import {Session} from '../domain/models/Session.js';
import {Message} from '../domain/models/Message';
import {IHistoryRepository} from '../domain/interfaces/IHistoryRepository';

export class CodehChat {
	private session: Session;

	constructor(private historyRepo: IHistoryRepository) {
		this.session = Session.createNew('claude-3-5-sonnet');
	}

	/**
	 * Send a message and get response
	 */
	async sendMessage(content: string): Promise<Message> {
		const userMessage = Message.user(content);
		this.session.addMessage(userMessage);

		// Save to history
		await this.historyRepo.addMessage(userMessage);

		return userMessage;
	}

	/**
	 * Add assistant response
	 */
	async addResponse(content: string): Promise<Message> {
		const assistantMessage = Message.assistant(content);
		this.session.addMessage(assistantMessage);

		// Save to history
		await this.historyRepo.addMessage(assistantMessage);

		return assistantMessage;
	}

	/**
	 * Get conversation history
	 */
	getHistory(): ReadonlyArray<Message> {
		return this.session.getMessages();
	}

	/**
	 * Get last N messages
	 */
	getLastMessages(n: number): ReadonlyArray<Message> {
		return this.session.getLastNMessages(n);
	}

	/**
	 * Clear conversation
	 */
	async clear(): Promise<void> {
		this.session.clear();
		await this.historyRepo.clear();
	}

	/**
	 * Start new conversation
	 */
	async startNew(): Promise<void> {
		this.session = Session.createNew('claude-3-5-sonnet');
		await this.historyRepo.startNewConversation();
	}

	/**
	 * Load conversation from history
	 */
	async loadFromHistory(conversationId: string): Promise<void> {
		const history = await this.historyRepo.load(conversationId);

		if (history) {
			const messages = history.messages.map(
				(m: any) =>
					new Message(
						m.id || `msg_${Date.now()}`,
						m.role,
						m.content,
						new Date(m.timestamp || Date.now()),
					),
			);
			
			// Use fromData to restore session with correct ID
			this.session = Session.fromData({
				id: history.id,
				name: history.metadata?.name || `Session ${history.id}`,
				messages: messages,
				metadata: {
					messageCount: messages.length,
					totalTokens: history.metadata?.totalTokens || 0,
					estimatedCost: history.metadata?.estimatedCost || 0,
					model: history.metadata?.model || 'claude-3-5-sonnet',
					...history.metadata
				},
				createdAt: new Date(history.createdAt || Date.now()),
				updatedAt: new Date(history.updatedAt || Date.now())
			});
		}
	}

	/**
	 * Get conversation stats
	 */
	getStats() {
		return {
			messageCount: this.session.getMessageCount(),
			userMessages: this.session.getUserMessages().length,
			assistantMessages: this.session.getAssistantMessages().length,
			estimatedTokens: this.session.estimateTokenCount(),
		};
	}

	/**
	 * Check if conversation needs compression
	 */
	needsCompression(maxTokens: number): boolean {
		return this.session.needsCompression(maxTokens);
	}

	/**
	 * Get session (formerly conversation)
	 */
	getSession(): Session {
		return this.session;
	}

	/**
	 * @deprecated Use getSession() instead
	 */
	getConversation(): Session {
		return this.session;
	}
}
