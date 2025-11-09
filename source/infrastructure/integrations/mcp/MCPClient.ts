/**
 * MCP (Model Context Protocol) Client
 * Client for connecting to MCP servers via stdio
 */

import {spawn, ChildProcess} from 'child_process';
import {EventEmitter} from 'events';
import * as readline from 'readline';

export interface MCPServer {
	name: string;
	command: string;
	args?: string[];
	env?: Record<string, string>;
}

export interface MCPResource {
	uri: string;
	name: string;
	description?: string;
	mimeType?: string;
}

export interface MCPTool {
	name: string;
	description: string;
	inputSchema: any;
}

export interface MCPPrompt {
	name: string;
	description?: string;
	arguments?: any[];
}

interface MCPServerConnection {
	config: MCPServer;
	process?: ChildProcess;
	connected: boolean;
	capabilities?: any;
	pendingRequests: Map<
		number,
		{resolve: (value: any) => void; reject: (error: Error) => void}
	>;
	messageId: number;
}

export class MCPClient extends EventEmitter {
	private servers: Map<string, MCPServerConnection> = new Map();

	constructor() {
		super();
	}

	/**
	 * Connect to MCP server
	 */
	async connectToServer(config: MCPServer): Promise<void> {
		if (this.servers.has(config.name)) {
			throw new Error(`Server "${config.name}" is already connected`);
		}

		const connection: MCPServerConnection = {
			config,
			connected: false,
			pendingRequests: new Map(),
			messageId: 0,
		};

		try {
			// Spawn MCP server process
			const serverProcess = spawn(config.command, config.args || [], {
				env: {...process.env, ...config.env},
				stdio: ['pipe', 'pipe', 'pipe'],
			});

			connection.process = serverProcess;

			// Setup readline for line-by-line JSON-RPC processing
			const rl = readline.createInterface({
				input: serverProcess.stdout!,
				crlfDelay: Infinity,
			});

			rl.on('line', line => {
				try {
					const message = JSON.parse(line);
					this.handleServerMessage(config.name, message);
				} catch (error) {
					this.emit('error', {
						server: config.name,
						error: new Error(`Failed to parse message: ${line}`),
					});
				}
			});

			// Handle stderr
			serverProcess.stderr?.on('data', data => {
				this.emit('serverLog', {
					server: config.name,
					log: data.toString(),
				});
			});

			// Handle process exit
			serverProcess.on('exit', code => {
				connection.connected = false;
				this.emit('serverDisconnected', {
					server: config.name,
					code,
				});
			});

			// Initialize MCP protocol
			const capabilities = await this.sendRequest(
				config.name,
				connection,
				'initialize',
				{
					protocolVersion: '2024-11-05',
					capabilities: {
						roots: {listChanged: true},
						sampling: {},
					},
					clientInfo: {
						name: 'CODEH',
						version: '1.0.0',
					},
				},
			);

			connection.capabilities = capabilities;
			connection.connected = true;

			// Send initialized notification
			this.sendNotification(
				config.name,
				connection,
				'notifications/initialized',
			);

			this.servers.set(config.name, connection);

			this.emit('serverConnected', {
				server: config.name,
				capabilities,
			});
		} catch (error) {
			if (connection.process) {
				connection.process.kill();
			}
			throw error;
		}
	}

	/**
	 * Handle incoming message from server
	 */
	private handleServerMessage(serverName: string, message: any): void {
		const connection = this.servers.get(serverName);
		if (!connection) return;

		// Handle response to our request
		if (message.id !== undefined && message.result !== undefined) {
			const pending = connection.pendingRequests.get(message.id);
			if (pending) {
				pending.resolve(message.result);
				connection.pendingRequests.delete(message.id);
			}
		}
		// Handle error response
		else if (message.id !== undefined && message.error !== undefined) {
			const pending = connection.pendingRequests.get(message.id);
			if (pending) {
				pending.reject(
					new Error(message.error.message || 'MCP request failed'),
				);
				connection.pendingRequests.delete(message.id);
			}
		}
		// Handle notification from server
		else if (message.method !== undefined) {
			this.emit('notification', {
				server: serverName,
				method: message.method,
				params: message.params,
			});
		}
	}

	/**
	 * Send JSON-RPC request to server
	 */
	private async sendRequest(
		serverName: string,
		connection: MCPServerConnection,
		method: string,
		params?: any,
	): Promise<any> {
		return new Promise((resolve, reject) => {
			const id = ++connection.messageId;
			const message = {
				jsonrpc: '2.0',
				id,
				method,
				params,
			};

			// Store pending request
			connection.pendingRequests.set(id, {resolve, reject});

			// Send to server via stdin
			const data = JSON.stringify(message) + '\n';
			connection.process?.stdin?.write(data);

			// Timeout after 30 seconds
			setTimeout(() => {
				if (connection.pendingRequests.has(id)) {
					connection.pendingRequests.delete(id);
					reject(new Error(`MCP request timeout: ${method}`));
				}
			}, 30000);
		});
	}

	/**
	 * Send JSON-RPC notification to server (no response expected)
	 */
	private sendNotification(
		serverName: string,
		connection: MCPServerConnection,
		method: string,
		params?: any,
	): void {
		const message = {
			jsonrpc: '2.0',
			method,
			params,
		};

		const data = JSON.stringify(message) + '\n';
		connection.process?.stdin?.write(data);
	}

	/**
	 * List available resources from server
	 */
	async listResources(serverName: string): Promise<MCPResource[]> {
		const connection = this.servers.get(serverName);
		if (!connection || !connection.connected) {
			throw new Error(`Server "${serverName}" is not connected`);
		}

		const result = await this.sendRequest(
			serverName,
			connection,
			'resources/list',
		);

		return result.resources || [];
	}

	/**
	 * Read a specific resource
	 */
	async readResource(serverName: string, uri: string): Promise<any> {
		const connection = this.servers.get(serverName);
		if (!connection || !connection.connected) {
			throw new Error(`Server "${serverName}" is not connected`);
		}

		const result = await this.sendRequest(
			serverName,
			connection,
			'resources/read',
			{uri},
		);

		return result.contents;
	}

	/**
	 * List available tools from server
	 */
	async listTools(serverName: string): Promise<MCPTool[]> {
		const connection = this.servers.get(serverName);
		if (!connection || !connection.connected) {
			throw new Error(`Server "${serverName}" is not connected`);
		}

		const result = await this.sendRequest(serverName, connection, 'tools/list');

		return result.tools || [];
	}

	/**
	 * Call a tool on the server
	 */
	async callTool(
		serverName: string,
		toolName: string,
		params: any,
	): Promise<any> {
		const connection = this.servers.get(serverName);
		if (!connection || !connection.connected) {
			throw new Error(`Server "${serverName}" is not connected`);
		}

		const result = await this.sendRequest(
			serverName,
			connection,
			'tools/call',
			{
				name: toolName,
				arguments: params,
			},
		);

		return result;
	}

	/**
	 * List available prompts from server
	 */
	async listPrompts(serverName: string): Promise<MCPPrompt[]> {
		const connection = this.servers.get(serverName);
		if (!connection || !connection.connected) {
			throw new Error(`Server "${serverName}" is not connected`);
		}

		const result = await this.sendRequest(
			serverName,
			connection,
			'prompts/list',
		);

		return result.prompts || [];
	}

	/**
	 * Get a specific prompt
	 */
	async getPrompt(
		serverName: string,
		promptName: string,
		args?: Record<string, string>,
	): Promise<any> {
		const connection = this.servers.get(serverName);
		if (!connection || !connection.connected) {
			throw new Error(`Server "${serverName}" is not connected`);
		}

		const result = await this.sendRequest(
			serverName,
			connection,
			'prompts/get',
			{
				name: promptName,
				arguments: args,
			},
		);

		return result;
	}

	/**
	 * Get server capabilities
	 */
	getCapabilities(serverName: string): any {
		const connection = this.servers.get(serverName);
		if (!connection) {
			throw new Error(`Server "${serverName}" not found`);
		}
		return connection.capabilities;
	}

	/**
	 * Check if server is connected
	 */
	isConnected(serverName: string): boolean {
		const connection = this.servers.get(serverName);
		return connection?.connected || false;
	}

	/**
	 * Get list of connected servers
	 */
	getConnectedServers(): string[] {
		return Array.from(this.servers.entries())
			.filter(([_, conn]) => conn.connected)
			.map(([name, _]) => name);
	}

	/**
	 * Disconnect from a specific server
	 */
	async disconnect(serverName: string): Promise<void> {
		const connection = this.servers.get(serverName);
		if (!connection) {
			return;
		}

		// Reject all pending requests
		for (const [id, {reject}] of connection.pendingRequests) {
			reject(new Error('Server disconnected'));
		}
		connection.pendingRequests.clear();

		// Kill the server process
		if (connection.process) {
			connection.process.kill();
		}

		connection.connected = false;
		this.servers.delete(serverName);

		this.emit('serverDisconnected', {server: serverName});
	}

	/**
	 * Disconnect from all servers
	 */
	async disconnectAll(): Promise<void> {
		const serverNames = Array.from(this.servers.keys());
		await Promise.all(serverNames.map(name => this.disconnect(name)));
	}
}
