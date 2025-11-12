/**
 * Handle Tool Calls Use Case
 * Orchestrates tool execution with permission handling
 */

import {ToolCall} from '../../domain/interfaces/IApiClient';
import {
	IToolPermissionHandler,
	ToolPermissionContext,
} from '../../domain/interfaces/IToolPermissionHandler';
import {ToolRegistry} from '../../tools/base/ToolRegistry';
import {ToolExecutionContext} from '../../domain/models/ToolExecutionContext';

export interface HandleToolCallsRequest {
	toolCalls: ToolCall[];
	conversationContext?: string;
}

export interface HandleToolCallsResponse {
	contexts: ToolExecutionContext[];
	allApproved: boolean;
	allCompleted: boolean;
}

export interface HandleToolCallsConfig {
	timeout?: number; // Timeout per tool execution (ms)
	maxRetries?: number; // Max retry attempts
	retryDelay?: number; // Delay between retries (ms)
}

export class HandleToolCalls {
	constructor(
		private toolRegistry: ToolRegistry,
		private permissionHandler: IToolPermissionHandler,
		private config: HandleToolCallsConfig = {},
	) {}

	/**
	 * Execute with timeout
	 */
	private async executeWithTimeout<T>(
		promise: Promise<T>,
		timeoutMs: number,
	): Promise<T> {
		return Promise.race([
			promise,
			new Promise<T>((_, reject) =>
				setTimeout(
					() => reject(new Error(`Timeout after ${timeoutMs}ms`)),
					timeoutMs,
				),
			),
		]);
	}

	/**
	 * Execute with retry logic
	 */
	private async executeWithRetry<T>(
		fn: () => Promise<T>,
		maxRetries: number,
		retryDelay: number,
	): Promise<T> {
		let lastError: Error | null = null;

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				return await fn();
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));

				if (attempt < maxRetries) {
					console.log(
						`  ⚠️  Retry ${attempt + 1}/${maxRetries} after ${retryDelay}ms...`,
					);
					await new Promise(resolve => setTimeout(resolve, retryDelay));
				}
			}
		}

		throw lastError;
	}

	async execute(
		request: HandleToolCallsRequest,
	): Promise<HandleToolCallsResponse> {
		const {toolCalls, conversationContext} = request;
		const contexts: ToolExecutionContext[] = [];

		for (let i = 0; i < toolCalls.length; i++) {
			const toolCall = toolCalls[i];
			console.log(
				`\n  [${i + 1}/${toolCalls.length}] Processing tool: ${toolCall.name}`,
			);

			let context = ToolExecutionContext.create(toolCall);

			// Step 1: Check pre-approval
			const hasPreApproval = this.permissionHandler.hasPreApproval(
				toolCall.name,
			);

			if (!hasPreApproval) {
				// Step 2: Request permission
				context = context.withStatus('awaiting_permission');
				contexts.push(context);

				const tool = this.toolRegistry.get(toolCall.name);
				const permissionContext: ToolPermissionContext = {
					toolCall,
					toolDescription: tool?.getDescription(),
					timestamp: new Date(),
					conversationContext,
				};

				const permissionResult =
					await this.permissionHandler.requestPermission(permissionContext);

				if (!permissionResult.approved) {
					// User rejected
					console.log(`  ❌ Permission denied for ${toolCall.name}`);
					context = context.withPermissionRejected();
					contexts[contexts.length - 1] = context;
					continue; // Skip to next tool
				}

				// Update context: permission granted
				context = context.withPermissionGranted();
			} else {
				// Pre-approved, mark as approved immediately
				console.log(`  ✅ Pre-approved: ${toolCall.name}`);
				context = context.withPermissionGranted();
			}

			// Step 3: Execute tool with timeout and retry
			console.log(`  ⚙️  Executing ${toolCall.name}...`);
			context = context.withExecutionStarted();
			contexts[contexts.length - 1] = context;

			try {
				const startTime = Date.now();

				// Execute with retry and timeout
				const executeFn = async () => {
					const execution = this.toolRegistry.execute(
						toolCall.name,
						toolCall.arguments,
					);

					// Apply timeout if configured
					if (this.config.timeout) {
						return await this.executeWithTimeout(
							execution,
							this.config.timeout,
						);
					}

					return await execution;
				};

				// Apply retry logic if configured
				const maxRetries = this.config.maxRetries || 0;
				const retryDelay = this.config.retryDelay || 1000;

				const result =
					maxRetries > 0
						? await this.executeWithRetry(executeFn, maxRetries, retryDelay)
						: await executeFn();

				const duration = Date.now() - startTime;

				context = context.withResult(result);

				if (result.success) {
					console.log(`  ✅ ${toolCall.name} completed (${duration}ms)`);
					const preview = result.output.substring(0, 100);
					console.log(
						`     Output preview: ${preview}${result.output.length > 100 ? '...' : ''}`,
					);
				} else {
					console.log(`  ❌ ${toolCall.name} failed: ${result.error}`);
				}
			} catch (error: any) {
				console.log(`  ❌ ${toolCall.name} threw error: ${error.message}`);
				context = context.withError(error.message);
			}

			// Update final context
			contexts[contexts.length - 1] = context;
		}

		// Check overall status
		const allApproved = contexts.every(c => !c.isRejected());
		const allCompleted = contexts.every(c => c.isCompleted());

		console.log(
			`\n  Summary: ${contexts.filter(c => c.isCompleted()).length}/${contexts.length} succeeded`,
		);

		return {
			contexts,
			allApproved,
			allCompleted,
		};
	}

	/**
	 * Execute tool calls in parallel (for independent tools)
	 */
	async executeParallel(
		request: HandleToolCallsRequest,
	): Promise<HandleToolCallsResponse> {
		const {toolCalls, conversationContext} = request;

		// Execute all tool calls concurrently
		const contextPromises = toolCalls.map(async toolCall => {
			let context = ToolExecutionContext.create(toolCall);

			// Check pre-approval
			const hasPreApproval = this.permissionHandler.hasPreApproval(
				toolCall.name,
			);

			if (!hasPreApproval) {
				// Request permission
				context = context.withStatus('awaiting_permission');

				const tool = this.toolRegistry.get(toolCall.name);
				const permissionContext: ToolPermissionContext = {
					toolCall,
					toolDescription: tool?.getDescription(),
					timestamp: new Date(),
					conversationContext,
				};

				const permissionResult =
					await this.permissionHandler.requestPermission(permissionContext);

				if (!permissionResult.approved) {
					return context.withPermissionRejected();
				}

				context = context.withPermissionGranted();
			} else {
				context = context.withPermissionGranted();
			}

			// Execute tool
			context = context.withExecutionStarted();

			try {
				const result = await this.toolRegistry.execute(
					toolCall.name,
					toolCall.arguments,
				);
				return context.withResult(result);
			} catch (error: any) {
				return context.withError(error.message);
			}
		});

		const contexts = await Promise.all(contextPromises);

		const allApproved = contexts.every(c => !c.isRejected());
		const allCompleted = contexts.every(c => c.isCompleted());

		return {
			contexts,
			allApproved,
			allCompleted,
		};
	}
}
