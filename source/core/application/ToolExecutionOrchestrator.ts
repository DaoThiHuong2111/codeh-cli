/**
 * Tool Execution Orchestrator
 * Coordinates tool execution pipeline: detect → permission → execute → format → continue
 */

import {IApiClient, ToolCall} from '../domain/interfaces/IApiClient';
import {IToolPermissionHandler} from '../domain/interfaces/IToolPermissionHandler';
import {IHistoryRepository} from '../domain/interfaces/IHistoryRepository';
import {ToolRegistry} from '../tools/base/ToolRegistry';
import {
	HandleToolCalls,
	HandleToolCallsResponse,
} from './usecases/HandleToolCalls';
import {ToolExecutionContext} from '../domain/models/ToolExecutionContext';
import {Message} from '../domain/models/Message';
import {Turn} from '../domain/models/Turn';
import {ToolDefinitionConverter} from './services/ToolDefinitionConverter';
import {ToolResultFormatter} from './services/ToolResultFormatter';

export interface ToolExecutionProgressEvent {
	type: 'iteration_start' | 'tools_detected' | 'tool_executing' | 'tool_completed' | 'tool_failed' | 'iteration_complete' | 'orchestration_complete';
	iteration?: number;
	maxIterations?: number;
	toolName?: string;
	toolIndex?: number;
	totalTools?: number;
	message?: string;
}

export interface ToolExecutionConfig {
	maxIterations?: number; // Max agentic loop iterations
	timeout?: number; // Timeout per tool execution (ms)
	parallel?: boolean; // Execute tools in parallel
}

export interface ToolExecutionResult {
	finalTurn: Turn;
	executionContexts: ToolExecutionContext[];
	iterations: number;
}

export class ToolExecutionOrchestrator {
	private handleToolCalls: HandleToolCalls;
	private resultFormatter: ToolResultFormatter;

	constructor(
		private toolRegistry: ToolRegistry,
		private permissionHandler: IToolPermissionHandler,
		private apiClient: IApiClient,
		private historyRepo: IHistoryRepository,
		private config: ToolExecutionConfig = {},
	) {
		this.handleToolCalls = new HandleToolCalls(
			toolRegistry,
			permissionHandler,
			{
				timeout: config.timeout,
				maxRetries: 2, // Default: retry up to 2 times
				retryDelay: 1000, // Default: 1 second delay
			},
		);
		this.resultFormatter = new ToolResultFormatter();
	}

	/**
	 * Orchestrate complete tool execution pipeline with agentic loop
	 * Returns final Turn after all tool executions and LLM continuations
	 * @param onStreamChunk Optional callback for streaming LLM responses during tool continuation
	 * @param onProgress Optional callback for tool execution progress updates
	 */
	async orchestrate(
		initialTurn: Turn,
		conversationContext?: string,
		onStreamChunk?: (chunk: string) => void,
		onProgress?: (event: ToolExecutionProgressEvent) => void,
	): Promise<ToolExecutionResult> {
		const maxIterations = this.config.maxIterations || 5;
		let currentTurn = initialTurn;
		const allExecutionContexts: ToolExecutionContext[] = [];
		let iterations = 0;

		console.log('\n🤖 Starting Tool Execution Orchestration');
		console.log(`Max iterations: ${maxIterations}\n`);

		// Agentic Loop: Continue while LLM requests tools and under limit
		while (iterations < maxIterations) {
			iterations++;
			console.log(`\n📍 Iteration ${iterations}/${maxIterations}`);

			// Emit iteration start event
			onProgress?.({
				type: 'iteration_start',
				iteration: iterations,
				maxIterations,
			});

			// Check if current turn has tool calls
			const toolCalls = currentTurn.response?.toolCalls;
			if (!toolCalls || toolCalls.length === 0) {
				// No more tools to execute, done
				console.log(
					'✅ No more tool calls detected. Orchestration complete.\n',
				);
				break;
			}

			console.log(`🔍 Detected ${toolCalls.length} tool call(s)`);

			// Emit tools detected event
			onProgress?.({
				type: 'tools_detected',
				totalTools: toolCalls.length,
				iteration: iterations,
			});

			// Execute tools with permission handling
			console.log('⚙️  Executing tools...');

			// Emit tool execution events for each tool
			for (let i = 0; i < toolCalls.length; i++) {
				onProgress?.({
					type: 'tool_executing',
					toolName: toolCalls[i].name,
					toolIndex: i + 1,
					totalTools: toolCalls.length,
					iteration: iterations,
				});
			}

			const handleResult = await this.executeTools(
				toolCalls,
				conversationContext,
			);
			allExecutionContexts.push(...handleResult.contexts);

			// Emit completion/failure events for each tool
			for (let i = 0; i < handleResult.contexts.length; i++) {
				const ctx = handleResult.contexts[i];
				if (ctx.isCompleted()) {
					onProgress?.({
						type: 'tool_completed',
						toolName: ctx.toolCall.name,
						toolIndex: i + 1,
						totalTools: handleResult.contexts.length,
						iteration: iterations,
					});
				} else if (ctx.isFailed()) {
					onProgress?.({
						type: 'tool_failed',
						toolName: ctx.toolCall.name,
						toolIndex: i + 1,
						totalTools: handleResult.contexts.length,
						iteration: iterations,
						message: ctx.error,
					});
				}
			}

			// Check if all approved
			if (!handleResult.allApproved) {
				// Some tools rejected - send rejection feedback to LLM
				console.log(
					' Some tools were rejected. Sending rejection feedback to LLM...\n',
				);

				// Format rejection messages (formatToolResults handles rejected contexts)
				const rejectionMessages = this.formatToolResults(handleResult.contexts);

				// Send rejection feedback to LLM so it can understand and adjust
				currentTurn = await this.continueWithToolResults(
					currentTurn,
					rejectionMessages,
					onStreamChunk,
				);

				console.log(
					'📨 LLM received rejection feedback and can try alternative approach',
				);

				// Continue orchestration - allow LLM to try again
				continue;
			}

			// Format tool results for LLM continuation
			const toolResultMessages = this.formatToolResults(handleResult.contexts);
			console.log(
				`✅ Tools executed successfully. Sending results back to LLM...`,
			);

			// Continue conversation with tool results
			currentTurn = await this.continueWithToolResults(
				currentTurn,
				toolResultMessages,
				onStreamChunk,
			);

			console.log('📨 Received LLM response');

			// If LLM response has no tool calls, we're done
			if (
				!currentTurn.response?.toolCalls ||
				currentTurn.response.toolCalls.length === 0
			) {
				console.log(
					'✅ LLM completed without requesting more tools. Orchestration complete.\n',
				);
				break;
			}
		}

		if (iterations >= maxIterations) {
			console.log('⚠️  Maximum iterations reached. Stopping orchestration.\n');
		}

		console.log(`🎯 Orchestration Summary:`);
		console.log(`   - Total iterations: ${iterations}`);
		console.log(`   - Tools executed: ${allExecutionContexts.length}`);
		console.log(
			`   - Final response length: ${currentTurn.response?.content.length || 0} chars\n`,
		);

		// Emit orchestration complete event
		onProgress?.({
			type: 'orchestration_complete',
			iteration: iterations,
			message: `Completed ${allExecutionContexts.length} tool executions in ${iterations} iterations`,
		});

		return {
			finalTurn: currentTurn,
			executionContexts: allExecutionContexts,
			iterations,
		};
	}

	/**
	 * Execute tools with permission handling
	 */
	private async executeTools(
		toolCalls: ToolCall[],
		conversationContext?: string,
	): Promise<HandleToolCallsResponse> {
		if (this.config.parallel) {
			return await this.handleToolCalls.executeParallel({
				toolCalls,
				conversationContext,
			});
		} else {
			return await this.handleToolCalls.execute({
				toolCalls,
				conversationContext,
			});
		}
	}

	/**
	 * Format tool execution results as messages for LLM
	 * Different APIs have different formats (Anthropic vs OpenAI)
	 */
	private formatToolResults(contexts: ToolExecutionContext[]): Message[] {
		const messages: Message[] = [];

		for (const context of contexts) {
			if (context.isCompleted() && context.result) {
				// Format successful tool result
				const content = this.formatToolResultContent(context);
				messages.push(
					Message.create('user', content, {
						metadata: {
							toolCallId: context.toolCall.id,
							toolName: context.toolCall.name,
							isToolResult: true,
						},
					}),
				);
			} else if (context.isFailed()) {
				// Format error result
				const errorContent = `Tool "${context.toolCall.name}" failed: ${context.error}`;
				messages.push(
					Message.create('user', errorContent, {
						metadata: {
							toolCallId: context.toolCall.id,
							toolName: context.toolCall.name,
							isToolResult: true,
							isError: true,
						},
					}),
				);
			} else if (context.isRejected()) {
				// Format rejection
				const rejectionContent = `Tool "${context.toolCall.name}" was rejected by user.`;
				messages.push(
					Message.create('user', rejectionContent, {
						metadata: {
							toolCallId: context.toolCall.id,
							toolName: context.toolCall.name,
							isToolResult: true,
							isRejection: true,
						},
					}),
				);
			}
		}

		return messages;
	}

	/**
	 * Format tool result content
	 * Uses standardized formatter for consistent, human-readable output
	 */
	private formatToolResultContent(context: ToolExecutionContext): string {
		if (!context.result) return '';

		// Use markdown formatter for rich, structured output
		return this.resultFormatter.formatAsMarkdown(context);
	}

	/**
	 * Continue conversation with tool results
	 * Send tool results back to LLM and get next response
	 * @param onStreamChunk Optional callback for streaming LLM response
	 */
	private async continueWithToolResults(
		previousTurn: Turn,
		toolResultMessages: Message[],
		onStreamChunk?: (chunk: string) => void,
	): Promise<Turn> {
		// Get recent conversation history
		const recentMessages = await this.historyRepo.getRecentMessages(10);

		// Get tool definitions
		const tools = ToolDefinitionConverter.toApiFormatBatch(
			this.toolRegistry.getDefinitions(),
		);

		// Build messages array: history + tool results
		const messages = [
			...recentMessages.map(m => ({
				role: m.role,
				content: m.content,
			})),
			...toolResultMessages.map(m => ({
				role: m.role,
				content: m.content,
			})),
		];
		        const requestBody = { messages, tools };

        const bodyString = JSON.stringify(requestBody);

        console.log('🔥 [TOOL CONTINUATION] Request body size:', bodyString.length, 'bytes =', (bodyString.length / 1024 / 1024).toFixed(2), 'MB');

        console.log('🔥 [TOOL CONTINUATION] Messages count:', messages.length);

        console.log('🔥 [TOOL CONTINUATION] Tool result messages count:', toolResultMessages.length);

        console.log('🔥 [TOOL CONTINUATION] Recent messages count:', recentMessages.length);

		// Call LLM with tool results and tool definitions
		// Use streaming if callback provided for better UX
		let apiResponse;
		let fullContent = '';

		if (onStreamChunk) {
			// Stream LLM response to user in real-time
			apiResponse = await this.apiClient.streamChat(
				{messages, tools},
				chunk => {
					if (chunk.content) {
						fullContent += chunk.content;
						onStreamChunk(chunk.content);
					}
				},
			);
		} else {
			// Non-streaming for backward compatibility
			apiResponse = await this.apiClient.chat({messages, tools});
		}

		// Create new turn
		const toolResultMsg = Message.create(
			'user',
			toolResultMessages.map(m => m.content).join('\n\n'),
		);
		const responseMsg = Message.assistant(
			apiResponse.content,
			apiResponse.toolCalls,
		);

		await this.historyRepo.addMessage(toolResultMsg);
		await this.historyRepo.addMessage(responseMsg);

		return Turn.create(toolResultMsg)
			.withResponse(responseMsg)
			.withToolCalls(apiResponse.toolCalls || []);
	}

	/**
	 * Check if Turn requires tool execution
	 */
	static requiresToolExecution(turn: Turn): boolean {
		return turn.hasToolCalls();
	}
}
