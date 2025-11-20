/**
 * Message Compression Service
 * Compresses conversation history by summarizing old messages using LLM
 */

import {Message} from '../../domain/models/Message.js';
import {IApiClient} from '../../domain/interfaces/IApiClient.js';
import {getLogger} from '../../../infrastructure/logging/Logger.js';

const logger = getLogger();

export interface CompressionResult {
	/** Compressed summary message */
	compressedMessage: Message;
	/** Number of messages that were compressed */
	compressedCount: number;
	/** Original token count (estimated) */
	originalTokens: number;
	/** Compressed token count (estimated) */
	compressedTokens: number;
}

export class MessageCompressionService {
	private readonly COMPRESSION_SYSTEM_PROMPT = `You are a conversation summarizer. Your task is to compress a conversation history into a concise summary while preserving all important information, context, decisions, and key details.

Rules:
- Preserve all technical details, code snippets, file paths, and specific information
- Maintain chronological order of important events
- Keep user requests and assistant responses clearly separated
- Use bullet points for clarity
- Be concise but comprehensive
- Do not lose any critical context that might be needed for future messages

Format the summary as:
## Conversation Summary
[Your compressed summary here]`;

	constructor(private apiClient: IApiClient) {}

	/**
	 * Compress messages into a single summary message
	 * @param messages Messages to compress (should be chronologically ordered)
	 * @param maxTokens Maximum tokens allowed for the summary
	 */
	async compressMessages(
		messages: Message[],
		maxTokens: number = 4000,
	): Promise<CompressionResult> {
		logger.info(
			'MessageCompressionService',
			'compressMessages',
			'Starting compression',
			{
				message_count: messages.length,
				max_tokens: maxTokens,
			},
		);

		if (messages.length === 0) {
			throw new Error('Cannot compress empty message array');
		}

		const originalTokens = this.estimateTokenCount(messages);

		const conversationText = this.buildConversationText(messages);

		logger.debug(
			'MessageCompressionService',
			'compressMessages',
			'Built conversation text',
			{
				text_length: conversationText.length,
				estimated_tokens: originalTokens,
			},
		);

		try {
			const response = await this.apiClient.chat({
				messages: [
					{
						role: 'user',
						content: `Please compress the following conversation history:\n\n${conversationText}`,
					},
				],
				systemPrompt: this.COMPRESSION_SYSTEM_PROMPT,
				maxTokens: maxTokens,
				temperature: 0.3, // Lower temperature for more consistent summaries
			});

			const compressedContent = response.content;
			const compressedTokens = Math.ceil(compressedContent.length / 4);

			logger.info(
				'MessageCompressionService',
				'compressMessages',
				'Compression completed',
				{
					original_tokens: originalTokens,
					compressed_tokens: compressedTokens,
					compression_ratio: (
						(compressedTokens / originalTokens) *
						100
					).toFixed(2) + '%',
					messages_compressed: messages.length,
				},
			);

			const compressedMessage = Message.create('system', compressedContent, {
				metadata: {
					isCompressed: true,
					compressedCount: messages.length,
					originalTokens,
					compressedTokens,
					compressedAt: new Date().toISOString(),
					compressedMessageIds: messages.map(m => m.id),
				},
			});

			return {
				compressedMessage,
				compressedCount: messages.length,
				originalTokens,
				compressedTokens,
			};
		} catch (error: any) {
			logger.error(
				'MessageCompressionService',
				'compressMessages',
				'Compression failed',
				{
					error: error.message,
					message_count: messages.length,
				},
			);
			throw new Error(`Failed to compress messages: ${error.message}`);
		}
	}

	/**
	 * Build conversation text from messages for compression
	 */
	private buildConversationText(messages: Message[]): string {
		return messages
			.map((msg, index) => {
				const role = msg.role.toUpperCase();
				const timestamp = msg.timestamp.toISOString();
				return `[${index + 1}] ${role} (${timestamp}):\n${msg.content}\n`;
			})
			.join('\n---\n\n');
	}

	/**
	 * Estimate token count for messages (4 chars = 1 token)
	 */
	private estimateTokenCount(messages: Message[]): number {
		const totalChars = messages.reduce(
			(sum, msg) => sum + msg.content.length,
			0,
		);
		return Math.ceil(totalChars / 4);
	}
}
