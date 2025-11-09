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
		);
	}

	/**
	 * Orchestrate complete tool execution pipeline with agentic loop
	 * Returns final Turn after all tool executions and LLM continuations
	 */
	async orchestrate(
		initialTurn: Turn,
		conversationContext?: string,
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

			// Check if current turn has tool calls
			const toolCalls = currentTurn.response?.toolCalls;
			if (!toolCalls || toolCalls.length === 0) {
				// No more tools to execute, done
				console.log('✅ No more tool calls detected. Orchestration complete.\n');
				break;
			}

			console.log(`🔍 Detected ${toolCalls.length} tool call(s)`);

			// Execute tools with permission handling
			console.log('⚙️  Executing tools...');
			const handleResult = await this.executeTools(toolCalls, conversationContext);
			allExecutionContexts.push(...handleResult.contexts);

			// Check if all approved
			if (!handleResult.allApproved) {
				// Some tools rejected, stop agentic loop
				// TODO: Send rejection info back to LLM
				console.log('❌ Some tools were rejected. Stopping orchestration.\n');
				break;
			}

			// Format tool results for LLM continuation
			const toolResultMessages = this.formatToolResults(handleResult.contexts);
			console.log(`✅ Tools executed successfully. Sending results back to LLM...`);

			// Continue conversation with tool results
			currentTurn = await this.continueWithToolResults(
				currentTurn,
				toolResultMessages,
			);

			console.log('📨 Received LLM response');

			// If LLM response has no tool calls, we're done
			if (!currentTurn.response?.toolCalls || currentTurn.response.toolCalls.length === 0) {
				console.log('✅ LLM completed without requesting more tools. Orchestration complete.\n');
				break;
			}
		}

		if (iterations >= maxIterations) {
			console.log('⚠️  Maximum iterations reached. Stopping orchestration.\n');
		}

		console.log(`🎯 Orchestration Summary:`);
		console.log(`   - Total iterations: ${iterations}`);
		console.log(`   - Tools executed: ${allExecutionContexts.length}`);
		console.log(`   - Final response length: ${currentTurn.response?.content.length || 0} chars\n`);

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
				messages.push(Message.create('user', content, {
					metadata: {
						toolCallId: context.toolCall.id,
						toolName: context.toolCall.name,
						isToolResult: true,
					},
				}));
			} else if (context.isFailed()) {
				// Format error result
				const errorContent = `Tool "${context.toolCall.name}" failed: ${context.error}`;
				messages.push(Message.create('user', errorContent, {
					metadata: {
						toolCallId: context.toolCall.id,
						toolName: context.toolCall.name,
						isToolResult: true,
						isError: true,
					},
				}));
			} else if (context.isRejected()) {
				// Format rejection
				const rejectionContent = `Tool "${context.toolCall.name}" was rejected by user.`;
				messages.push(Message.create('user', rejectionContent, {
					metadata: {
						toolCallId: context.toolCall.id,
						toolName: context.toolCall.name,
						isToolResult: true,
						isRejection: true,
					},
				}));
			}
		}

		return messages;
	}

	/**
	 * Format tool result content
	 * For now, simple text format. In future, support structured formats.
	 */
	private formatToolResultContent(context: ToolExecutionContext): string {
		if (!context.result) return '';

		const result = context.result;
		let content = `Tool "${context.toolCall.name}" executed successfully.\n`;

		if (result.output) {
			content += `Output:\n${result.output}\n`;
		}

		if (result.metadata) {
			content += `Metadata: ${JSON.stringify(result.metadata)}\n`;
		}

		return content.trim();
	}

	/**
	 * Continue conversation with tool results
	 * Send tool results back to LLM and get next response
	 */
	private async continueWithToolResults(
		previousTurn: Turn,
		toolResultMessages: Message[],
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

		// Call LLM with tool results and tool definitions
		const apiResponse = await this.apiClient.chat({messages, tools});

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
