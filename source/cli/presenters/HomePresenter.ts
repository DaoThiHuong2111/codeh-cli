/**
 * Home Presenter
 * Handles business logic for Home screen
 */

import {CodehClient} from '../../core/application/CodehClient';
import {CodehChat} from '../../core/application/CodehChat';
import {ExecutionResult, ConversationViewModel} from './types';

export class HomePresenter {
	constructor(
		private client: CodehClient,
		private chat: CodehChat,
	) {}

	/**
	 * Handle user input
	 */
	async handleInput(input: string): Promise<ExecutionResult> {
		try {
			const startTime = Date.now();
			const turn = await this.client.execute(input);

			if (!turn.isComplete() || !turn.response) {
				return {
					success: false,
					output: '',
					error: 'Failed to get response from AI',
				};
			}

			return {
				success: true,
				output: turn.response.content,
				metadata: {
					duration: Date.now() - startTime,
					tokenUsage: turn.getTokenUsage(),
				},
			};
		} catch (error: any) {
			return {
				success: false,
				output: '',
				error: error.message || 'Unknown error occurred',
			};
		}
	}

	/**
	 * Get conversation view model
	 */
	getConversation(): ConversationViewModel {
		const messages = this.chat.getHistory();
		const stats = this.chat.getStats();

		return {
			messages: messages.map(m => ({
				role: m.role,
				content: m.content,
				timestamp: m.timestamp,
			})),
			stats: {
				messageCount: stats.messageCount,
				estimatedTokens: stats.estimatedTokens,
			},
		};
	}

	/**
	 * Clear conversation
	 */
	async clearConversation(): Promise<void> {
		await this.chat.clear();
	}

	/**
	 * Start new conversation
	 */
	async startNewConversation(): Promise<void> {
		await this.chat.startNew();
	}

	/**
	 * Check if conversation needs compression
	 */
	needsCompression(): boolean {
		return this.chat.needsCompression(100000);
	}
}
