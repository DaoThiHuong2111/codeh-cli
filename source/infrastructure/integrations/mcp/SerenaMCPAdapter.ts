/**
 * Serena MCP Adapter
 * Adapter for integrating Serena MCP server with codeh-cli
 * Provides LSP-based context management tools
 */

import {MCPClient, MCPServer, MCPTool} from './MCPClient';

export interface SerenaConfig {
	projectRoot: string;
	serverPath?: string;
	pythonPath?: string;
}

export interface SymbolInfo {
	name: string;
	namePath: string;
	kind: number;
	relativePath: string;
	bodyLocation: {
		startLine: number;
		endLine: number;
	};
	body?: string;
	children?: SymbolInfo[];
}

export interface ReferenceInfo {
	symbol: SymbolInfo;
	line: number;
	contentAroundReference: string;
}

export interface SearchPatternOptions {
	pattern: string;
	relativePath?: string;
	contextLinesBefore?: number;
	contextLinesAfter?: number;
	restrictToCodeFiles?: boolean;
	includeGlob?: string;
	excludeGlob?: string;
}

export interface MemoryInfo {
	name: string;
	description?: string;
}

/**
 * Adapter class for Serena MCP server
 * Provides type-safe wrappers around Serena tools
 */
export class SerenaMCPAdapter {
	private mcpClient: MCPClient;
	private serverName = 'serena';
	private connected = false;
	private config: SerenaConfig;
	private availableTools: MCPTool[] = [];

	constructor(config: SerenaConfig) {
		this.config = config;
		this.mcpClient = new MCPClient();
	}

	/**
	 * Connect to Serena MCP server
	 */
	async connect(): Promise<void> {
		if (this.connected) {
			return;
		}

		const serverConfig: MCPServer = {
			name: this.serverName,
			command: this.config.serverPath || 'uvx',
			args: [
				'--from',
				'git+https://github.com/oraios/serena',
				'serena',
				'start-mcp-server',
				'--project-root',
				this.config.projectRoot,
			],
			env: this.config.pythonPath ? {PYTHON: this.config.pythonPath} : {},
		};

		try {
			await this.mcpClient.connectToServer(serverConfig);
			this.availableTools = await this.mcpClient.listTools(this.serverName);
			this.connected = true;
		} catch (error) {
			throw new Error(
				`Failed to connect to Serena MCP server: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Disconnect from Serena MCP server
	 */
	async disconnect(): Promise<void> {
		if (!this.connected) {
			return;
		}

		await this.mcpClient.disconnect(this.serverName);
		this.connected = false;
	}

	/**
	 * Check if connected to Serena
	 */
	isConnected(): boolean {
		return this.connected;
	}

	/**
	 * Get available tools from Serena
	 */
	getAvailableTools(): MCPTool[] {
		return this.availableTools;
	}

	/**
	 * Execute a tool on Serena MCP server
	 */
	private async executeTool<T>(
		toolName: string,
		args: Record<string, any>,
	): Promise<T> {
		if (!this.connected) {
			throw new Error('Not connected to Serena MCP server');
		}

		try {
			const result = await this.mcpClient.callTool(
				this.serverName,
				toolName,
				args,
			);
			return result as T;
		} catch (error) {
			throw new Error(
				`Failed to execute tool ${toolName}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Get an overview of symbols in a file
	 * @param relativePath - Relative path to file from project root
	 */
	async getSymbolsOverview(relativePath: string): Promise<SymbolInfo[]> {
		const result = await this.executeTool<string>('get_symbols_overview', {
			relative_path: relativePath,
		});

		try {
			return JSON.parse(result);
		} catch (error) {
			throw new Error(`Failed to parse symbols overview: ${String(error)}`);
		}
	}

	/**
	 * Find symbols by name pattern
	 * @param namePath - Symbol name path pattern (e.g., "ClassName/methodName")
	 * @param options - Search options
	 */
	async findSymbol(
		namePath: string,
		options: {
			relativePath?: string;
			includeBody?: boolean;
			depth?: number;
			includeKinds?: number[];
			excludeKinds?: number[];
			substringMatching?: boolean;
		} = {},
	): Promise<SymbolInfo[]> {
		const result = await this.executeTool<string>('find_symbol', {
			name_path: namePath,
			relative_path: options.relativePath || '',
			include_body: options.includeBody || false,
			depth: options.depth || 0,
			include_kinds: options.includeKinds || [],
			exclude_kinds: options.excludeKinds || [],
			substring_matching: options.substringMatching || false,
		});

		try {
			return JSON.parse(result);
		} catch (error) {
			throw new Error(`Failed to parse find symbol result: ${String(error)}`);
		}
	}

	/**
	 * Find all references to a symbol
	 * @param namePath - Symbol name path
	 * @param relativePath - File containing the symbol
	 */
	async findReferencingSymbols(
		namePath: string,
		relativePath: string,
	): Promise<ReferenceInfo[]> {
		const result = await this.executeTool<string>('find_referencing_symbols', {
			name_path: namePath,
			relative_path: relativePath,
		});

		try {
			return JSON.parse(result);
		} catch (error) {
			throw new Error(`Failed to parse references: ${String(error)}`);
		}
	}

	/**
	 * Replace the body of a symbol
	 */
	async replaceSymbolBody(
		namePath: string,
		relativePath: string,
		body: string,
	): Promise<void> {
		await this.executeTool<string>('replace_symbol_body', {
			name_path: namePath,
			relative_path: relativePath,
			body,
		});
	}

	/**
	 * Insert code after a symbol
	 */
	async insertAfterSymbol(
		namePath: string,
		relativePath: string,
		body: string,
	): Promise<void> {
		await this.executeTool<string>('insert_after_symbol', {
			name_path: namePath,
			relative_path: relativePath,
			body,
		});
	}

	/**
	 * Insert code before a symbol
	 */
	async insertBeforeSymbol(
		namePath: string,
		relativePath: string,
		body: string,
	): Promise<void> {
		await this.executeTool<string>('insert_before_symbol', {
			name_path: namePath,
			relative_path: relativePath,
			body,
		});
	}

	/**
	 * Rename a symbol throughout the codebase
	 */
	async renameSymbol(
		namePath: string,
		relativePath: string,
		newName: string,
	): Promise<void> {
		await this.executeTool<string>('rename_symbol', {
			name_path: namePath,
			relative_path: relativePath,
			new_name: newName,
		});
	}

	/**
	 * List directory contents
	 */
	async listDir(
		relativePath: string,
		recursive: boolean = false,
	): Promise<{directories: string[]; files: string[]}> {
		const result = await this.executeTool<string>('list_dir', {
			relative_path: relativePath,
			recursive,
		});

		try {
			return JSON.parse(result);
		} catch (error) {
			throw new Error(`Failed to parse directory listing: ${String(error)}`);
		}
	}

	/**
	 * Find files by pattern
	 */
	async findFile(
		fileMask: string,
		relativePath: string = '.',
	): Promise<string[]> {
		const result = await this.executeTool<string>('find_file', {
			file_mask: fileMask,
			relative_path: relativePath,
		});

		try {
			return JSON.parse(result);
		} catch (error) {
			throw new Error(`Failed to parse file search result: ${String(error)}`);
		}
	}

	/**
	 * Search for pattern in files
	 */
	async searchForPattern(
		options: SearchPatternOptions,
	): Promise<Record<string, string[]>> {
		const result = await this.executeTool<string>('search_for_pattern', {
			substring_pattern: options.pattern,
			relative_path: options.relativePath || '',
			context_lines_before: options.contextLinesBefore || 0,
			context_lines_after: options.contextLinesAfter || 0,
			restrict_search_to_code_files: options.restrictToCodeFiles || false,
			paths_include_glob: options.includeGlob || '',
			paths_exclude_glob: options.excludeGlob || '',
		});

		try {
			return JSON.parse(result);
		} catch (error) {
			throw new Error(`Failed to parse search result: ${String(error)}`);
		}
	}

	/**
	 * Write memory about project
	 */
	async writeMemory(name: string, content: string): Promise<void> {
		await this.executeTool<string>('write_memory', {
			memory_file_name: name,
			content,
		});
	}

	/**
	 * Read memory
	 */
	async readMemory(name: string): Promise<string> {
		return this.executeTool<string>('read_memory', {
			memory_file_name: name,
		});
	}

	/**
	 * List available memories
	 */
	async listMemories(): Promise<MemoryInfo[]> {
		const result = await this.executeTool<string>('list_memories', {});

		try {
			return JSON.parse(result);
		} catch (error) {
			throw new Error(`Failed to parse memories list: ${String(error)}`);
		}
	}

	/**
	 * Delete memory
	 */
	async deleteMemory(name: string): Promise<void> {
		await this.executeTool<string>('delete_memory', {
			memory_file_name: name,
		});
	}

	/**
	 * Check if onboarding was performed
	 */
	async checkOnboardingPerformed(): Promise<string> {
		return this.executeTool<string>('check_onboarding_performed', {});
	}

	/**
	 * Get onboarding instructions
	 */
	async getOnboardingInstructions(): Promise<string> {
		return this.executeTool<string>('onboarding', {});
	}

	/**
	 * Get initial instructions for using Serena
	 */
	async getInitialInstructions(): Promise<string> {
		return this.executeTool<string>('initial_instructions', {});
	}

	/**
	 * Activate a project
	 */
	async activateProject(projectPath: string): Promise<void> {
		await this.executeTool<string>('activate_project', {
			project: projectPath,
		});
	}

	/**
	 * Get current configuration
	 */
	async getCurrentConfig(): Promise<any> {
		const result = await this.executeTool<string>('get_current_config', {});

		try {
			return JSON.parse(result);
		} catch (error) {
			return result;
		}
	}
}
