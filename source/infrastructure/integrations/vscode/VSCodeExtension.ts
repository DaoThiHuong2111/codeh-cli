/**
 * VS Code Extension Integration
 * Protocol for communicating with VS Code extension
 */

import {EventEmitter} from 'events';
import {WebSocket} from 'ws';

export interface VSCodeMessage {
	type: 'request' | 'response' | 'notification';
	id?: string;
	method?: string;
	params?: any;
	result?: any;
	error?: any;
}

export interface VSCodeConfig {
	mode: 'websocket' | 'stdio';
	port?: number;
	timeout?: number;
}

export class VSCodeExtension extends EventEmitter {
	private connected: boolean = false;
	private ws?: WebSocket;
	private config: VSCodeConfig;
	private pendingRequests: Map<
		string,
		{resolve: (value: any) => void; reject: (error: Error) => void}
	> = new Map();
	private messageId = 0;

	constructor(config: VSCodeConfig = {mode: 'websocket', port: 9000}) {
		super();
		this.config = {
			timeout: 30000,
			...config,
		};
	}

	/**
	 * Connect to VS Code extension
	 */
	async connect(): Promise<boolean> {
		if (this.config.mode === 'websocket') {
			return this.connectWebSocket();
		} else {
			return this.connectStdio();
		}
	}

	/**
	 * Connect via WebSocket
	 */
	private async connectWebSocket(): Promise<boolean> {
		return new Promise((resolve, reject) => {
			const port = this.config.port || 9000;
			const url = `ws://localhost:${port}`;

			try {
				this.ws = new WebSocket(url);

				this.ws.on('open', () => {
					this.connected = true;
					this.emit('connected');
					resolve(true);
				});

				this.ws.on('message', (data: string) => {
					try {
						const message: VSCodeMessage = JSON.parse(data.toString());
						this.handleMessage(message);
					} catch (error) {
						this.emit('error', error);
					}
				});

				this.ws.on('error', error => {
					this.connected = false;
					this.emit('error', error);
					reject(error);
				});

				this.ws.on('close', () => {
					this.connected = false;
					this.emit('disconnected');
				});

				// Connection timeout
				setTimeout(() => {
					if (!this.connected) {
						reject(new Error('Connection timeout'));
					}
				}, this.config.timeout || 5000);
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * Connect via stdio (for process-based communication)
	 */
	private async connectStdio(): Promise<boolean> {
		// For stdio mode, we read from stdin and write to stdout
		// This is useful when CODEH is spawned as a child process
		process.stdin.on('data', data => {
			try {
				const message: VSCodeMessage = JSON.parse(data.toString());
				this.handleMessage(message);
			} catch (error) {
				this.emit('error', error);
			}
		});

		this.connected = true;
		this.emit('connected');
		return true;
	}

	/**
	 * Handle incoming message
	 */
	private handleMessage(message: VSCodeMessage): void {
		if (message.type === 'response') {
			// Handle response to our request
			const pending = this.pendingRequests.get(message.id!);
			if (pending) {
				if (message.error) {
					pending.reject(new Error(message.error.message || 'Unknown error'));
				} else {
					pending.resolve(message.result);
				}
				this.pendingRequests.delete(message.id!);
			}
		} else if (message.type === 'request') {
			// Handle incoming request from VS Code
			this.emit('request', message);
		} else if (message.type === 'notification') {
			// Handle notification
			this.emit('notification', message);
		}
	}

	/**
	 * Send request to VS Code extension
	 */
	async sendRequest(method: string, params?: any): Promise<any> {
		if (!this.connected) {
			throw new Error('Not connected to VS Code extension');
		}

		const id = (++this.messageId).toString();
		const message: VSCodeMessage = {
			type: 'request',
			id,
			method,
			params,
		};

		return new Promise((resolve, reject) => {
			// Store pending request
			this.pendingRequests.set(id, {resolve, reject});

			// Send message
			this.sendMessage(message);

			// Set timeout
			setTimeout(() => {
				if (this.pendingRequests.has(id)) {
					this.pendingRequests.delete(id);
					reject(new Error(`Request timeout: ${method}`));
				}
			}, this.config.timeout || 30000);
		});
	}

	/**
	 * Send response to VS Code request
	 */
	sendResponse(id: string, result?: any, error?: any): void {
		const message: VSCodeMessage = {
			type: 'response',
			id,
			result,
			error,
		};
		this.sendMessage(message);
	}

	/**
	 * Send notification (fire and forget)
	 */
	sendNotification(method: string, params?: any): void {
		const message: VSCodeMessage = {
			type: 'notification',
			method,
			params,
		};
		this.sendMessage(message);
	}

	/**
	 * Send message through active transport
	 */
	private sendMessage(message: VSCodeMessage): void {
		const data = JSON.stringify(message);

		if (this.config.mode === 'websocket' && this.ws) {
			this.ws.send(data);
		} else if (this.config.mode === 'stdio') {
			process.stdout.write(data + '\n');
		}
	}

	/**
	 * Disconnect from VS Code extension
	 */
	disconnect(): void {
		if (this.ws) {
			this.ws.close();
			this.ws = undefined;
		}

		// Reject all pending requests
		for (const [id, {reject}] of this.pendingRequests) {
			reject(new Error('Disconnected'));
		}
		this.pendingRequests.clear();

		this.connected = false;
		this.emit('disconnected');
	}

	/**
	 * Check connection status
	 */
	isConnected(): boolean {
		return this.connected;
	}

	/**
	 * Get extension capabilities
	 */
	async getCapabilities(): Promise<{
		features: string[];
		version: string;
	}> {
		return this.sendRequest('vscode/getCapabilities');
	}

	/**
	 * Open file in VS Code
	 */
	async openFile(path: string, line?: number, column?: number): Promise<void> {
		return this.sendRequest('vscode/openFile', {path, line, column});
	}

	/**
	 * Show message in VS Code
	 */
	async showMessage(
		message: string,
		type: 'info' | 'warning' | 'error' = 'info',
	): Promise<void> {
		return this.sendRequest('vscode/showMessage', {message, type});
	}

	/**
	 * Execute VS Code command
	 */
	async executeCommand(command: string, args?: any[]): Promise<any> {
		return this.sendRequest('vscode/executeCommand', {command, args});
	}
}
