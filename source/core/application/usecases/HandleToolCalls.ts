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

export class HandleToolCalls {
	constructor(
		private toolRegistry: ToolRegistry,
		private permissionHandler: IToolPermissionHandler,
	) {}

	async execute(
		request: HandleToolCallsRequest,
	): Promise<HandleToolCallsResponse> {
		const {toolCalls, conversationContext} = request;
		const contexts: ToolExecutionContext[] = [];

		for (const toolCall of toolCalls) {
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
					context = context.withPermissionRejected();
					contexts[contexts.length - 1] = context;
					continue; // Skip to next tool
				}

				// Update context: permission granted
				context = context.withPermissionGranted();
			} else {
				// Pre-approved, mark as approved immediately
				context = context.withPermissionGranted();
			}

			// Step 3: Execute tool
			context = context.withExecutionStarted();
			contexts[contexts.length - 1] = context;

			try {
				const result = await this.toolRegistry.execute(
					toolCall.name,
					toolCall.arguments,
				);

				context = context.withResult(result);
			} catch (error: any) {
				context = context.withError(error.message);
			}

			// Update final context
			contexts[contexts.length - 1] = context;
		}

		// Check overall status
		const allApproved = contexts.every(c => !c.isRejected());
		const allCompleted = contexts.every(c => c.isCompleted());

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
