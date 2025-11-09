/**
 * Tool Registry
 * Manages available tools
 */

import {Tool} from './Tool';
import {ToolExecutionResult} from '../../domain/interfaces/IToolExecutor';

export class ToolRegistry {
	private tools: Map<string, Tool> = new Map();

	/**
	 * Register a tool
	 */
	register(tool: Tool): void {
		this.tools.set(tool.getName(), tool);
	}

	/**
	 * Unregister a tool
	 */
	unregister(name: string): void {
		this.tools.delete(name);
	}

	/**
	 * Get a tool by name
	 */
	get(name: string): Tool | undefined {
		return this.tools.get(name);
	}

	/**
	 * Check if tool exists
	 */
	has(name: string): boolean {
		return this.tools.has(name);
	}

	/**
	 * Get all tools
	 */
	getAll(): Tool[] {
		return Array.from(this.tools.values());
	}

	/**
	 * Get all tool names
	 */
	getAllNames(): string[] {
		return Array.from(this.tools.keys());
	}

	/**
	 * Execute a tool
	 */
	async execute(
		name: string,
		parameters: Record<string, any>,
	): Promise<ToolExecutionResult> {
		const tool = this.tools.get(name);

		if (!tool) {
			return {
				success: false,
				output: '',
				error: `Tool '${name}' not found`,
			};
		}

		try {
			if (!tool.validateParameters(parameters)) {
				return {
					success: false,
					output: '',
					error: `Invalid parameters for tool '${name}'`,
				};
			}

			return await tool.execute(parameters);
		} catch (error: any) {
			return {
				success: false,
				output: '',
				error: `Tool execution failed: ${error.message}`,
			};
		}
	}

	/**
	 * Get tool definitions for AI
	 */
	getDefinitions() {
		return this.getAll().map(tool => tool.getDefinition());
	}
}
