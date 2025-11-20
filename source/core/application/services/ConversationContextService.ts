/**
 * Conversation Context Service
 * Manages conversation context with automatic compression when needed
 */

import {Message} from '../../domain/models/Message.js';
import {IHistoryRepository} from '../../domain/interfaces/IHistoryRepository.js';
import {IApiClient} from '../../domain/interfaces/IApiClient.js';
import {MessageCompressionService} from './MessageCompressionService.js';
import {getLogger} from '../../../infrastructure/logging/Logger.js';

const logger = getLogger();

export interface ContextOptions {
	maxTokens: number;
	compressionThreshold?: number; // Default: 0.8 (80%)
}

export class ConversationContextService {
	private compressionService: MessageCompressionService;

	constructor(private historyRepo: IHistoryRepository, apiClient: IApiClient) {
		this.compressionService = new MessageCompressionService(apiClient);
	}

	/**
	 * Get messages for LLM with automatic compression if needed
	 * This is the main method to use when preparing messages for API calls
	 * 
	 * Flow:
	 * 1. Get all messages from history
	 * 2. Check if compression is needed (>80% of maxTokens)
	 * 3. If needed, compress old messages and return [compressed, ...new messages]
	 * 4. If not needed, return all messages
	 */
	async getMessagesForLLM(options: ContextOptions): Promise<Message[]> {
		const {maxTokens, compressionThreshold = 0.8} = options;

		logger.debug(
			'ConversationContextService',
			'getMessagesForLLM',
			'Getting messages for LLM',
			{
				max_tokens: maxTokens,
				compression_threshold: compressionThreshold,
			},
		);

		const session = await this.historyRepo.getCurrentSession();
		if (!session) {
			logger.warn(
				'ConversationContextService',
				'getMessagesForLLM',
				'No active session found',
			);
			return [];
		}

		const messages = session.getMessagesForLLM();
		const estimatedTokens = this.estimateTokenCount(messages);

		logger.debug(
			'ConversationContextService',
			'getMessagesForLLM',
			'Current context stats',
			{
				message_count: messages.length,
				estimated_tokens: estimatedTokens,
				has_compression: session.hasCompression(),
				threshold: maxTokens * compressionThreshold,
			},
		);

		const needsCompression = estimatedTokens > maxTokens * compressionThreshold;

		if (!needsCompression) {
			logger.debug(
				'ConversationContextService',
				'getMessagesForLLM',
				'No compression needed',
			);
			return Array.from(messages);
		}

		logger.info(
			'ConversationContextService',
			'getMessagesForLLM',
			'Compression needed, starting compression',
			{
				estimated_tokens: estimatedTokens,
				threshold: maxTokens * compressionThreshold,
			},
		);

		// Perform compression
		return await this.compressAndGetMessages(session, maxTokens);
	}

	/**
	 * Compress old messages and return updated message list
	 */
	private async compressAndGetMessages(
		session: any,
		maxTokens: number,
	): Promise<Message[]> {
		const allMessages = session.getMessages();
		const lastCompressedIndex = session.metadata.lastCompressedIndex ?? -1;

		const keepRecentCount = 3;
		const startIndex = lastCompressedIndex + 1; // Start after last compression
		const endIndex = Math.max(
			startIndex,
			allMessages.length - keepRecentCount,
		);

		if (endIndex <= startIndex) {
			logger.warn(
				'ConversationContextService',
				'compressAndGetMessages',
				'Not enough messages to compress',
				{
					start_index: startIndex,
					end_index: endIndex,
					total_messages: allMessages.length,
				},
			);
			return Array.from(session.getMessagesForLLM());
		}

		const messagesToCompress = allMessages.slice(startIndex, endIndex);

		logger.info(
			'ConversationContextService',
			'compressAndGetMessages',
			'Compressing messages',
			{
				compress_from: startIndex,
				compress_to: endIndex,
				compress_count: messagesToCompress.length,
				keep_recent: keepRecentCount,
			},
		);

		try {
			const compressionResult = await this.compressionService.compressMessages(
				messagesToCompress,
				Math.floor(maxTokens * 0.3),
			);

			session.setCompressedMessage(
				compressionResult.compressedMessage,
				endIndex - 1,
			);

			await this.historyRepo.saveSession(session);

			logger.info(
				'ConversationContextService',
				'compressAndGetMessages',
				'Compression completed and saved',
				{
					compressed_count: compressionResult.compressedCount,
					original_tokens: compressionResult.originalTokens,
					compressed_tokens: compressionResult.compressedTokens,
					compression_ratio: (
						(compressionResult.compressedTokens /
							compressionResult.originalTokens) *
						100
					).toFixed(2) + '%',
				},
			);

			return Array.from(session.getMessagesForLLM());
		} catch (error: any) {
			logger.error(
				'ConversationContextService',
				'compressAndGetMessages',
				'Compression failed, returning uncompressed messages',
				{
					error: error.message,
				},
			);
			return Array.from(session.getMessagesForLLM());
		}
	}

	/**
	 * Estimate token count for messages (4 chars = 1 token)
	 */
	private estimateTokenCount(messages: readonly Message[]): number {
		const totalChars = messages.reduce(
			(sum, msg) => sum + msg.content.length,
			0,
		);
		return Math.ceil(totalChars / 4);
	}
}
