/**
 * Lazy Tool Registry
 *
 * Registry that loads tools on-demand (lazy loading) instead of eagerly loading
 * all tools at startup. This improves startup time and memory usage.
 *
 * Features:
 * - Tools are instantiated only when first requested
 * - Tool instances are cached after first load
 * - Supports tool definition without instantiation
 * - Compatible with existing ToolRegistry interface
 *
 * @example
 * ```typescript
 * const registry = new LazyToolRegistry();
 *
 * // Register tool factory (not instantiated yet)
 * registry.registerLazy('shell', () => new ShellTool(executor));
 *
 * // Tool is instantiated on first getTool() call
 * const shellTool = registry.getTool('shell'); // First call - instantiates
 * const shellTool2 = registry.getTool('shell'); // Cached - no instantiation
 * ```
 */

import {Tool} from './Tool.js';
import {ToolDefinition} from '../../domain/interfaces/IToolExecutor.js';

/**
 * Factory function that creates a tool instance
 */
type ToolFactory = () => Tool;

/**
 * Tool registration entry with lazy loading support
 */
interface ToolRegistration {
	factory: ToolFactory;
	instance?: Tool;
	definition?: ToolDefinition;
}

/**
 * Lazy tool registry with on-demand loading
 *
 * @class LazyToolRegistry
 */
export class LazyToolRegistry {
	/** Map of tool name to registration */
	private tools: Map<string, ToolRegistration> = new Map();

	/** Cache for all tool definitions (lightweight) */
	private definitionsCache?: ToolDefinition[];

	/**
	 * Register a tool with lazy loading
	 *
	 * The tool factory is registered but not executed until the tool is first accessed.
	 *
	 * @param {string} name - Unique tool name
	 * @param {ToolFactory} factory - Factory function that creates the tool
	 * @param {ToolDefinition} [definition] - Optional: tool definition for listing without instantiation
	 */
	registerLazy(name: string, factory: ToolFactory, definition?: ToolDefinition): void {
		this.tools.set(name, {
			factory,
			definition,
		});
		// Clear cache when new tool is registered
		this.definitionsCache = undefined;
	}

	/**
	 * Register a tool instance (eager loading)
	 *
	 * For compatibility with existing code that uses pre-instantiated tools.
	 *
	 * @param {Tool} tool - Tool instance
	 */
	register(tool: Tool): void {
		this.tools.set(tool.getName(), {
			factory: () => tool,
			instance: tool,
			definition: tool.getDefinition(),
		});
		// Clear cache when new tool is registered
		this.definitionsCache = undefined;
	}

	/**
	 * Get a tool by name (lazy loads on first access)
	 *
	 * @param {string} name - Tool name
	 * @returns {Tool | undefined} Tool instance or undefined if not found
	 */
	getTool(name: string): Tool | undefined {
		const registration = this.tools.get(name);
		if (!registration) {
			return undefined;
		}

		// Return cached instance if available
		if (registration.instance) {
			return registration.instance;
		}

		// Lazy load: instantiate tool on first access
		try {
			registration.instance = registration.factory();
			return registration.instance;
		} catch (error) {
			console.error(`Failed to lazy load tool "${name}":`, error);
			return undefined;
		}
	}

	/**
	 * Get all tool instances (forces loading of all tools)
	 *
	 * Use with caution - defeats the purpose of lazy loading.
	 * Prefer getAllToolDefinitions() for listing available tools.
	 *
	 * @returns {Tool[]} Array of all tool instances
	 */
	getAllTools(): Tool[] {
		const tools: Tool[] = [];

		for (const [name, registration] of this.tools.entries()) {
			const tool = this.getTool(name);
			if (tool) {
				tools.push(tool);
			}
		}

		return tools;
	}

	/**
	 * Get all tool definitions without instantiating tools
	 *
	 * This is efficient for listing available tools without loading them.
	 * Falls back to instantiation if definition wasn't provided during registration.
	 *
	 * @returns {ToolDefinition[]} Array of tool definitions
	 */
	getAllToolDefinitions(): ToolDefinition[] {
		// Return cached definitions if available
		if (this.definitionsCache) {
			return this.definitionsCache;
		}

		const definitions: ToolDefinition[] = [];

		for (const [name, registration] of this.tools.entries()) {
			// Use cached definition if available
			if (registration.definition) {
				definitions.push(registration.definition);
				continue;
			}

			// Use instance definition if tool is already loaded
			if (registration.instance) {
				const def = registration.instance.getDefinition();
				registration.definition = def;
				definitions.push(def);
				continue;
			}

			// Last resort: instantiate to get definition
			// This defeats lazy loading but ensures we can list all tools
			const tool = this.getTool(name);
			if (tool) {
				const def = tool.getDefinition();
				registration.definition = def;
				definitions.push(def);
			}
		}

		// Cache definitions for future calls
		this.definitionsCache = definitions;
		return definitions;
	}

	/**
	 * Check if a tool is registered
	 *
	 * @param {string} name - Tool name
	 * @returns {boolean} True if tool is registered
	 */
	hasTool(name: string): boolean {
		return this.tools.has(name);
	}

	/**
	 * Get count of registered tools
	 *
	 * @returns {number} Number of registered tools
	 */
	getToolCount(): number {
		return this.tools.size;
	}

	/**
	 * Get count of loaded (instantiated) tools
	 *
	 * @returns {number} Number of loaded tools
	 */
	getLoadedToolCount(): number {
		let count = 0;
		for (const registration of this.tools.values()) {
			if (registration.instance) {
				count++;
			}
		}
		return count;
	}

	/**
	 * Get names of all registered tools
	 *
	 * @returns {string[]} Array of tool names
	 */
	getToolNames(): string[] {
		return Array.from(this.tools.keys());
	}

	/**
	 * Get names of loaded (instantiated) tools
	 *
	 * @returns {string[]} Array of loaded tool names
	 */
	getLoadedToolNames(): string[] {
		const names: string[] = [];
		for (const [name, registration] of this.tools.entries()) {
			if (registration.instance) {
				names.push(name);
			}
		}
		return names;
	}

	/**
	 * Unregister a tool by name
	 *
	 * @param {string} name - Tool name to unregister
	 */
	unregister(name: string): void {
		this.tools.delete(name);
		this.definitionsCache = undefined;
	}

	/**
	 * Clear all tools (unregister all)
	 *
	 * Useful for testing or resetting the registry.
	 */
	clear(): void {
		this.tools.clear();
		this.definitionsCache = undefined;
	}

	/**
	 * Execute a tool by name
	 *
	 * Compatible interface with ToolRegistry.
	 *
	 * @param {string} name - Tool name
	 * @param {Record<string, any>} parameters - Tool parameters
	 * @returns {Promise<ToolExecutionResult>} Execution result
	 */
	async execute(
		name: string,
		parameters: Record<string, any>,
	): Promise<import('../../domain/interfaces/IToolExecutor.js').ToolExecutionResult> {
		const tool = this.getTool(name);

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
	 * Get tool definitions for AI (alias for getAllToolDefinitions)
	 *
	 * Compatible interface with ToolRegistry.
	 *
	 * @returns {ToolDefinition[]} Array of tool definitions
	 */
	getDefinitions(): ToolDefinition[] {
		return this.getAllToolDefinitions();
	}

	/**
	 * Get a tool by name (alias for getTool)
	 *
	 * Compatible interface with ToolRegistry.
	 *
	 * @param {string} name - Tool name
	 * @returns {Tool | undefined} Tool instance or undefined
	 */
	get(name: string): Tool | undefined {
		return this.getTool(name);
	}

	/**
	 * Check if tool exists (alias for hasTool)
	 *
	 * Compatible interface with ToolRegistry.
	 *
	 * @param {string} name - Tool name
	 * @returns {boolean} True if tool exists
	 */
	has(name: string): boolean {
		return this.hasTool(name);
	}

	/**
	 * Get all tool instances (alias for getAllTools)
	 *
	 * Compatible interface with ToolRegistry.
	 *
	 * @returns {Tool[]} Array of all tools
	 */
	getAll(): Tool[] {
		return this.getAllTools();
	}

	/**
	 * Get all tool names (alias for getToolNames)
	 *
	 * Compatible interface with ToolRegistry.
	 *
	 * @returns {string[]} Array of tool names
	 */
	getAllNames(): string[] {
		return this.getToolNames();
	}

	/**
	 * Preload specific tools
	 *
	 * Useful for preloading commonly used tools at startup.
	 *
	 * @param {string[]} names - Tool names to preload
	 * @returns {Tool[]} Array of preloaded tools
	 */
	preload(names: string[]): Tool[] {
		const tools: Tool[] = [];
		for (const name of names) {
			const tool = this.getTool(name);
			if (tool) {
				tools.push(tool);
			}
		}
		return tools;
	}

	/**
	 * Preload all tools
	 *
	 * Use only when you truly need all tools loaded.
	 */
	preloadAll(): void {
		this.getAllTools();
	}
}
