/**
 * Base Tool Class
 *
 * Abstract base class that all tools must extend. Provides common functionality
 * for tool execution, parameter validation, and result formatting.
 *
 * @abstract
 * @implements {IToolExecutor}
 *
 * @example
 * ```typescript
 * export class MyTool extends Tool {
 *   constructor(dependencies) {
 *     super('my_tool', 'Description of my tool');
 *   }
 *
 *   getDefinition(): ToolDefinition {
 *     return {
 *       name: 'my_tool',
 *       description: 'My tool description',
 *       inputSchema: { ... }
 *     };
 *   }
 *
 *   validateParameters(parameters: unknown): boolean {
 *     return validateAndParse(MyToolSchema, parameters).success;
 *   }
 *
 *   async execute(args: MyToolArgs): Promise<ToolExecutionResult> {
 *     // Implementation
 *     return this.createSuccessResult('Success message', metadata);
 *   }
 * }
 * ```
 */

import {
	IToolExecutor,
	ToolDefinition,
	ToolExecutionResult,
} from '../../domain/interfaces/IToolExecutor';

export abstract class Tool implements IToolExecutor {
	/**
	 * Create a new Tool instance
	 *
	 * @param name - Unique tool name (kebab-case recommended)
	 * @param description - Brief description of what the tool does
	 */
	constructor(
		protected name: string,
		protected description: string,
	) {}

	/**
	 * Get the tool definition for LLM API registration
	 *
	 * This method must return a complete tool definition including:
	 * - name: Tool identifier
	 * - description: What the tool does
	 * - inputSchema: JSON Schema for parameters
	 *
	 * @abstract
	 * @returns {ToolDefinition} Complete tool definition
	 */
	abstract getDefinition(): ToolDefinition;

	/**
	 * Execute the tool with given parameters
	 *
	 * This is the main tool logic. Should validate parameters first,
	 * perform the operation, and return a consistent result format.
	 *
	 * @abstract
	 * @param parameters - Tool parameters (validated by validateParameters)
	 * @returns {Promise<ToolExecutionResult>} Execution result with success status
	 * @throws {ToolExecutionError} If execution fails unexpectedly
	 */
	abstract execute(
		parameters: Record<string, any>,
	): Promise<ToolExecutionResult>;

	/**
	 * Validate tool parameters
	 *
	 * Should use Zod schemas from ToolSchemas.ts for type-safe validation.
	 * Return false if validation fails (errors will be logged automatically).
	 *
	 * @abstract
	 * @param parameters - Parameters to validate
	 * @returns {boolean} True if parameters are valid
	 *
	 * @example
	 * ```typescript
	 * validateParameters(parameters: unknown): parameters is MyToolArgs {
	 *   const result = validateAndParse(MyToolSchema, parameters);
	 *   if (!result.success) {
	 *     console.error('Validation failed:', result.error);
	 *     return false;
	 *   }
	 *   return true;
	 * }
	 * ```
	 */
	abstract validateParameters(parameters: Record<string, any>): boolean;

	/**
	 * Create a success result
	 *
	 * Helper method to create consistent success results.
	 *
	 * @protected
	 * @param output - Human-readable success message
	 * @param metadata - Optional structured result data
	 * @returns {ToolExecutionResult} Success result
	 */
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

	/**
	 * Create an error result
	 *
	 * Helper method to create consistent error results.
	 *
	 * @protected
	 * @param error - Error message
	 * @param output - Optional human-readable output
	 * @param metadata - Optional additional error context
	 * @returns {ToolExecutionResult} Error result
	 */
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

	/**
	 * Get the tool name
	 *
	 * @returns {string} Tool name
	 */
	getName(): string {
		return this.name;
	}

	/**
	 * Get the tool description
	 *
	 * @returns {string} Tool description
	 */
	getDescription(): string {
		return this.description;
	}
}
