/**
 * Interface for tool execution
 */

export interface ToolParameter {
	name: string;
	type: string;
	description: string;
	required: boolean;
	default?: any;
}

export interface ToolDefinition {
	name: string;
	description: string;
	parameters?: ToolParameter[]; // Old format (deprecated)
	inputSchema?: {
		// New format (Anthropic API compatible)
		type: string;
		properties?: Record<string, any>;
		required?: string[];
	};
}

export interface ToolExecutionResult {
	success: boolean;
	output: string;
	error?: string;
	metadata?: Record<string, any>;
}

export interface IToolExecutor {
	/**
	 * Get tool definition
	 */
	getDefinition(): ToolDefinition;

	/**
	 * Execute the tool
	 */
	execute(parameters: Record<string, any>): Promise<ToolExecutionResult>;

	/**
	 * Validate parameters before execution
	 */
	validateParameters(parameters: Record<string, any>): boolean;
}
