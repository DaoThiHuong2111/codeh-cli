/**
 * Tool Registry Interface
 *
 * Common interface for both ToolRegistry and LazyToolRegistry,
 * ensuring compatibility across the codebase.
 */

import {Tool} from './Tool.js';
import {
	ToolDefinition,
	ToolExecutionResult,
} from '../../domain/interfaces/IToolExecutor.js';

/**
 * Interface for tool registries
 *
 * @interface IToolRegistry
 */
export interface IToolRegistry {
	/**
	 * Register a tool
	 *
	 * @param tool - Tool instance to register
	 */
	register(tool: Tool): void;

	/**
	 * Unregister a tool by name
	 *
	 * @param name - Tool name
	 */
	unregister(name: string): void;

	/**
	 * Get a tool by name
	 *
	 * @param name - Tool name
	 * @returns Tool instance or undefined
	 */
	get(name: string): Tool | undefined;

	/**
	 * Check if a tool exists
	 *
	 * @param name - Tool name
	 * @returns True if tool exists
	 */
	has(name: string): boolean;

	/**
	 * Get all tool instances
	 *
	 * @returns Array of all tools
	 */
	getAll(): Tool[];

	/**
	 * Get all tool names
	 *
	 * @returns Array of tool names
	 */
	getAllNames(): string[];

	/**
	 * Execute a tool by name
	 *
	 * @param name - Tool name
	 * @param parameters - Tool parameters
	 * @returns Execution result
	 */
	execute(
		name: string,
		parameters: Record<string, any>,
	): Promise<ToolExecutionResult>;

	/**
	 * Get tool definitions for AI
	 *
	 * @returns Array of tool definitions
	 */
	getDefinitions(): ToolDefinition[];
}
