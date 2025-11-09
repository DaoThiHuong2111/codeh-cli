/**
 * Execute Tool Use Case
 * Executes tools requested by AI or user
 */

import {Tool} from '../../tools/base/Tool';
import {ToolExecutionResult} from '../../domain/interfaces/IToolExecutor';

// Type aliases
export type ToolCall = {
	name: string;
	parameters: Record<string, any>;
};

export interface ExecuteToolRequest {
	toolCall: ToolCall;
	availableTools: Tool[];
	context?: Record<string, any>;
}

export interface ExecuteToolResponse {
	result: ToolExecutionResult;
	toolName: string;
	executionTime: number;
	success: boolean;
}

export class ExecuteTool {
	async execute(request: ExecuteToolRequest): Promise<ExecuteToolResponse> {
		const {toolCall, availableTools, context = {}} = request;
		const startTime = Date.now();

		// Find the tool
		const tool = availableTools.find(t => t.getName() === toolCall.name);

		if (!tool) {
			return {
				result: {
					success: false,
					output: `Tool "${toolCall.name}" not found`,
					error: `Unknown tool: ${toolCall.name}`,
				},
				toolName: toolCall.name,
				executionTime: Date.now() - startTime,
				success: false,
			};
		}

		// Validate parameters
		const validation = this.validateParameters(toolCall.parameters, tool);
		if (!validation.valid) {
			return {
				result: {
					success: false,
					output: `Invalid parameters: ${validation.errors.join(', ')}`,
					error: validation.errors.join(', '),
				},
				toolName: toolCall.name,
				executionTime: Date.now() - startTime,
				success: false,
			};
		}

		// Execute tool
		try {
			const result = await tool.execute(toolCall.parameters);

			return {
				result,
				toolName: tool.getName(),
				executionTime: Date.now() - startTime,
				success: result.success,
			};
		} catch (error) {
			return {
				result: {
					success: false,
					output: error instanceof Error ? error.message : 'Unknown error',
					error: error instanceof Error ? error.message : 'Unknown error',
				},
				toolName: tool.getName(),
				executionTime: Date.now() - startTime,
				success: false,
			};
		}
	}

	/**
	 * Execute multiple tools in sequence
	 */
	async executeMultiple(
		requests: ExecuteToolRequest[],
	): Promise<ExecuteToolResponse[]> {
		const results: ExecuteToolResponse[] = [];

		for (const request of requests) {
			const result = await this.execute(request);
			results.push(result);

			// Stop on first failure if needed
			if (!result.success) {
				break;
			}
		}

		return results;
	}

	private validateParameters(
		params: any,
		tool: Tool,
	): {valid: boolean; errors: string[]} {
		const errors: string[] = [];

		// Use tool's own validation
		const isValid = tool.validateParameters(params);
		if (!isValid) {
			errors.push('Invalid parameters for tool');
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}
}
