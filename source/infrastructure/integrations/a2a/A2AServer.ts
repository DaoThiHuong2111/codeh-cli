/**
 * Agent-to-Agent (A2A) Server
 * Exposes CODEH CLI as an agent that other agents can call
 */

import * as http from 'http';
import {EventEmitter} from 'events';
import {WebSocketServer, WebSocket} from 'ws';

export interface A2ARequest {
	method: string;
	params: any;
	metadata?: {
		requestId?: string;
		timestamp?: string;
		callerAgent?: string;
	};
}

export interface A2AResponse {
	result?: any;
	error?: {
		code: number;
		message: string;
	};
	metadata?: {
		requestId?: string;
		timestamp?: string;
	};
}

export interface A2AServerConfig {
	port?: number;
	enableWebSocket?: boolean;
	enableHttp?: boolean;
	cors?: boolean;
	timeout?: number;
}

type RequestHandler = (
	request: A2ARequest,
) => Promise<A2AResponse['result']> | A2AResponse['result'];

export class A2AServer extends EventEmitter {
	private config: Required<A2AServerConfig>;
	private httpServer?: http.Server;
	private wsServer?: WebSocketServer;
	private running: boolean = false;
	private handlers: Map<string, RequestHandler> = new Map();
	private clients: Set<WebSocket> = new Set();

	constructor(config: A2AServerConfig = {}) {
		super();
		this.config = {
			port: config.port || 3000,
			enableWebSocket: config.enableWebSocket !== false,
			enableHttp: config.enableHttp !== false,
			cors: config.cors !== false,
			timeout: config.timeout || 60000,
		};
	}

	/**
	 * Start the A2A server
	 */
	async start(): Promise<void> {
		if (this.running) {
			throw new Error('Server is already running');
		}

		// Create HTTP server
		this.httpServer = http.createServer((req, res) => {
			this.handleHttpRequest(req, res);
		});

		// Create WebSocket server if enabled
		if (this.config.enableWebSocket) {
			this.wsServer = new WebSocketServer({server: this.httpServer});

			this.wsServer.on('connection', (ws: WebSocket) => {
				this.handleWebSocketConnection(ws);
			});
		}

		// Start listening
		await new Promise<void>((resolve, reject) => {
			this.httpServer!.listen(this.config.port, () => {
				this.running = true;
				this.emit('started', {port: this.config.port});
				resolve();
			});

			this.httpServer!.on('error', error => {
				reject(error);
			});
		});
	}

	/**
	 * Handle HTTP request
	 */
	private async handleHttpRequest(
		req: http.IncomingMessage,
		res: http.ServerResponse,
	): Promise<void> {
		// Enable CORS if configured
		if (this.config.cors) {
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
			res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

			if (req.method === 'OPTIONS') {
				res.writeHead(200);
				res.end();
				return;
			}
		}

		// Only accept POST requests
		if (req.method !== 'POST') {
			res.writeHead(405, {'Content-Type': 'application/json'});
			res.end(JSON.stringify({error: 'Method not allowed'}));
			return;
		}

		// Read request body
		let body = '';
		req.on('data', chunk => {
			body += chunk.toString();
		});

		req.on('end', async () => {
			try {
				const request: A2ARequest = JSON.parse(body);
				const response = await this.handleRequest(request);

				res.writeHead(200, {'Content-Type': 'application/json'});
				res.end(JSON.stringify(response));
			} catch (error) {
				const errorResponse: A2AResponse = {
					error: {
						code: 500,
						message: error instanceof Error ? error.message : 'Unknown error',
					},
				};

				res.writeHead(500, {'Content-Type': 'application/json'});
				res.end(JSON.stringify(errorResponse));
			}
		});
	}

	/**
	 * Handle WebSocket connection
	 */
	private handleWebSocketConnection(ws: WebSocket): void {
		this.clients.add(ws);
		this.emit('clientConnected', {clientId: this.getClientId(ws)});

		ws.on('message', async (data: Buffer) => {
			try {
				const request: A2ARequest = JSON.parse(data.toString());
				const response = await this.handleRequest(request);

				ws.send(JSON.stringify(response));
			} catch (error) {
				const errorResponse: A2AResponse = {
					error: {
						code: 500,
						message: error instanceof Error ? error.message : 'Unknown error',
					},
				};

				ws.send(JSON.stringify(errorResponse));
			}
		});

		ws.on('close', () => {
			this.clients.delete(ws);
			this.emit('clientDisconnected', {clientId: this.getClientId(ws)});
		});

		ws.on('error', error => {
			this.emit('error', {clientId: this.getClientId(ws), error});
		});
	}

	/**
	 * Handle A2A request
	 */
	async handleRequest(request: A2ARequest): Promise<A2AResponse> {
		const startTime = Date.now();

		try {
			// Validate request
			if (!request.method) {
				return {
					error: {
						code: 400,
						message: 'Missing method in request',
					},
				};
			}

			// Get handler for method
			const handler = this.handlers.get(request.method);
			if (!handler) {
				return {
					error: {
						code: 404,
						message: `Method "${request.method}" not found`,
					},
				};
			}

			// Execute handler with timeout
			const result = await Promise.race([
				handler(request),
				this.timeoutPromise(this.config.timeout),
			]);

			// Emit event
			this.emit('requestHandled', {
				method: request.method,
				duration: Date.now() - startTime,
				success: true,
			});

			return {
				result,
				metadata: {
					requestId: request.metadata?.requestId,
					timestamp: new Date().toISOString(),
				},
			};
		} catch (error) {
			this.emit('requestHandled', {
				method: request.method,
				duration: Date.now() - startTime,
				success: false,
				error,
			});

			return {
				error: {
					code: 500,
					message: error instanceof Error ? error.message : 'Unknown error',
				},
				metadata: {
					requestId: request.metadata?.requestId,
					timestamp: new Date().toISOString(),
				},
			};
		}
	}

	/**
	 * Register a method handler
	 */
	registerHandler(method: string, handler: RequestHandler): void {
		this.handlers.set(method, handler);
		this.emit('handlerRegistered', {method});
	}

	/**
	 * Unregister a method handler
	 */
	unregisterHandler(method: string): void {
		this.handlers.delete(method);
		this.emit('handlerUnregistered', {method});
	}

	/**
	 * Get all registered methods
	 */
	getRegisteredMethods(): string[] {
		return Array.from(this.handlers.keys());
	}

	/**
	 * Broadcast message to all connected WebSocket clients
	 */
	broadcast(message: any): void {
		const data = JSON.stringify(message);
		for (const client of this.clients) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(data);
			}
		}
	}

	/**
	 * Send message to specific client
	 */
	sendToClient(clientId: string, message: any): boolean {
		const client = Array.from(this.clients).find(
			c => this.getClientId(c) === clientId,
		);

		if (client && client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify(message));
			return true;
		}

		return false;
	}

	/**
	 * Get connected client count
	 */
	getClientCount(): number {
		return this.clients.size;
	}

	/**
	 * Get connected client IDs
	 */
	getClientIds(): string[] {
		return Array.from(this.clients).map(c => this.getClientId(c));
	}

	/**
	 * Stop the server
	 */
	async stop(): Promise<void> {
		if (!this.running) {
			return;
		}

		// Close all WebSocket clients
		for (const client of this.clients) {
			client.close();
		}
		this.clients.clear();

		// Close WebSocket server
		if (this.wsServer) {
			await new Promise<void>(resolve => {
				this.wsServer!.close(() => resolve());
			});
		}

		// Close HTTP server
		if (this.httpServer) {
			await new Promise<void>(resolve => {
				this.httpServer!.close(() => resolve());
			});
		}

		this.running = false;
		this.emit('stopped');
	}

	/**
	 * Check if server is running
	 */
	isRunning(): boolean {
		return this.running;
	}

	/**
	 * Get server configuration
	 */
	getConfig(): Readonly<A2AServerConfig> {
		return {...this.config};
	}

	/**
	 * Get server stats
	 */
	getStats(): {
		running: boolean;
		port: number;
		connectedClients: number;
		registeredHandlers: number;
		uptime: number;
	} {
		return {
			running: this.running,
			port: this.config.port,
			connectedClients: this.clients.size,
			registeredHandlers: this.handlers.size,
			uptime: this.running ? process.uptime() : 0,
		};
	}

	/**
	 * Helper: Create timeout promise
	 */
	private timeoutPromise(ms: number): Promise<never> {
		return new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Request timeout')), ms);
		});
	}

	/**
	 * Helper: Get unique client ID
	 */
	private getClientId(ws: WebSocket): string {
		// Use object reference as unique ID
		return (ws as any)._socketId || Math.random().toString(36);
	}
}
