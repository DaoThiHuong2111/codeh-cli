/**
 * Codeh Client - Main Orchestrator
 * Coordinates all application operations
 */

import {IApiClient} from '../domain/interfaces/IApiClient';
import {IHistoryRepository} from '../domain/interfaces/IHistoryRepository';
import {IToolPermissionHandler} from '../domain/interfaces/IToolPermissionHandler';
import {Turn} from '../domain/models/Turn';
import {Message} from '../domain/models/Message';
import {InputClassifier} from './services/InputClassifier';
import {OutputFormatter} from './services/OutputFormatter';
import {ToolRegistry} from '../tools/base/ToolRegistry';
import {ToolExecutionOrchestrator} from './ToolExecutionOrchestrator';

export class CodehClient {
	private inputClassifier: InputClassifier;
	private outputFormatter: OutputFormatter;
	private toolOrchestrator?: ToolExecutionOrchestrator;

	constructor(
		private apiClient: IApiClient,
		private historyRepo: IHistoryRepository,
		toolRegistry?: ToolRegistry,
		permissionHandler?: IToolPermissionHandler,
	) {
		this.inputClassifier = new InputClassifier();
		this.outputFormatter = new OutputFormatter();

		// Create tool orchestrator if tools are enabled
		if (toolRegistry && permissionHandler) {
			this.toolOrchestrator = new ToolExecutionOrchestrator(
				toolRegistry,
				permissionHandler,
				apiClient,
				historyRepo,
			);
		}
	}

	/**
	 * Execute a user input and return a Turn
	 */
	async execute(input: string): Promise<Turn> {
		const startTime = Date.now();

		// Validate input
		const validation = this.inputClassifier.validate(input);
		if (!validation.valid) {
			const errorMessage = validation.errors.join('\n');
			const requestMsg = Message.user(input);
			const responseMsg = Message.assistant(
				`❌ Input validation failed:\n${errorMessage}`,
			);

			return Turn.create(requestMsg)
				.withResponse(responseMsg)
				.withMetadata({duration: Date.now() - startTime});
		}

		// Create request message
		const requestMsg = Message.user(input);

		// Get history for context
		const recentMessages = await this.historyRepo.getRecentMessages(10);

		// Call AI API
		try {
			const apiResponse = await this.apiClient.chat({
				messages: [
					...recentMessages.map(m => ({
						role: m.role,
						content: m.content,
					})),
					{role: 'user', content: input},
				],
			});

			// Create response message
			const responseMsg = Message.assistant(apiResponse.content);

			// Save to history
			await this.historyRepo.addMessage(requestMsg);
			await this.historyRepo.addMessage(responseMsg);

			// Create turn with metadata
			return Turn.create(requestMsg)
				.withResponse(responseMsg)
				.withMetadata({
					duration: Date.now() - startTime,
					tokenUsage: apiResponse.usage
						? {
								prompt: apiResponse.usage.promptTokens,
								completion: apiResponse.usage.completionTokens,
								total: apiResponse.usage.totalTokens,
							}
						: undefined,
					model: apiResponse.model,
					finishReason: apiResponse.finishReason,
				});
		} catch (error: any) {
			const errorMsg = Message.assistant(`❌ Error: ${error.message}`);

			return Turn.create(requestMsg)
				.withResponse(errorMsg)
				.withMetadata({
					duration: Date.now() - startTime,
				});
		}
	}

	/**
	 * Execute with streaming - calls onChunk for each content chunk
	 * Returns final Turn when complete
	 */
	async executeWithStreaming(
		input: string,
		onChunk: (content: string) => void,
	): Promise<Turn> {
		const startTime = Date.now();

		// Validate input
		const validation = this.inputClassifier.validate(input);
		if (!validation.valid) {
			const errorMessage = validation.errors.join('\n');
			const requestMsg = Message.user(input);
			const responseMsg = Message.assistant(
				`❌ Input validation failed:\n${errorMessage}`,
			);

			return Turn.create(requestMsg)
				.withResponse(responseMsg)
				.withMetadata({duration: Date.now() - startTime});
		}

		// Create request message
		const requestMsg = Message.user(input);

		// Get history for context
		const recentMessages = await this.historyRepo.getRecentMessages(10);

		let fullResponse = '';
		let usage: any = undefined;

		try {
			const apiResponse = await this.apiClient.streamChat(
				{
					messages: [
						...recentMessages.map(m => ({
							role: m.role,
							content: m.content,
						})),
						{role: 'user', content: input},
					],
				},
				chunk => {
					if (chunk.content) {
						fullResponse += chunk.content;
						onChunk(chunk.content);
					}
					if (chunk.usage) {
						usage = chunk.usage;
					}
				},
			);

			// Create response message with full content and tool calls
			const responseMsg = Message.assistant(
				fullResponse,
				apiResponse.toolCalls,
			);

			// Save to history
			await this.historyRepo.addMessage(requestMsg);
			await this.historyRepo.addMessage(responseMsg);

			// Create turn with tool calls if present
			let turn = Turn.create(requestMsg)
				.withResponse(responseMsg)
				.withMetadata({
					duration: Date.now() - startTime,
					tokenUsage: usage
						? {
								prompt: usage.promptTokens,
								completion: usage.completionTokens,
								total: usage.totalTokens,
							}
						: undefined,
					model: apiResponse.model,
					finishReason: apiResponse.finishReason,
				});

			// Add tool calls to turn if present
			if (apiResponse.toolCalls && apiResponse.toolCalls.length > 0) {
				turn = turn.withToolCalls(apiResponse.toolCalls);
			}

			return turn;
		} catch (error: any) {
			const errorMsg = Message.assistant(`❌ Error: ${error.message}`);

			return Turn.create(requestMsg)
				.withResponse(errorMsg)
				.withMetadata({
					duration: Date.now() - startTime,
				});
		}
	}

	/**
	 * Get API client
	 */
	getApiClient(): IApiClient {
		return this.apiClient;
	}

	/**
	 * Get history repository
	 */
	getHistoryRepository(): IHistoryRepository {
		return this.historyRepo;
	}
}
