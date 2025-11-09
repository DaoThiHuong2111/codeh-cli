/**
 * Base Tool Interface
 * All tools must implement this interface
 */

import {
	IToolExecutor,
	ToolDefinition,
	ToolExecutionResult,
} from '../../domain/interfaces/IToolExecutor';

export abstract class Tool implements IToolExecutor {
	constructor(
		protected name: string,
		protected description: string,
	) {}

	abstract getDefinition(): ToolDefinition;

	abstract execute(
		parameters: Record<string, any>,
	): Promise<ToolExecutionResult>;

	abstract validateParameters(parameters: Record<string, any>): boolean;

	protected createSuccessResult(
		output: string,
		metadata?: Record<string, any>,
	): ToolExecutionResult {
		return {
			success: true,
			output,
			metadata,
		};
	}

	protected createErrorResult(
		error: string,
		output: string = '',
		metadata?: Record<string, any>,
	): ToolExecutionResult {
		return {
			success: false,
			output,
			error,
			metadata,
		};
	}

	getName(): string {
		return this.name;
	}

	getDescription(): string {
		return this.description;
	}
}
