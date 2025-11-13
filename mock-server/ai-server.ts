/**
 * Mock AI Server
 * Simulates AI responses with tool calling for testing
 */

import * as http from 'http';

interface ToolCall {
	id: string;
	type: 'function';
	function: {
		name: string;
		arguments: string;
	};
}

interface MockResponse {
	content: string;
	toolCalls?: ToolCall[];
}

/**
 * Mock AI Server that simulates tool usage
 */
export class MockAIServer {
	private server?: http.Server;
	private port: number;
	private scenarios: Map<string, MockResponse[]> = new Map();

	constructor(port: number = 3456) {
		this.port = port;
		this.setupScenarios();
	}

	/**
	 * Setup mock scenarios
	 */
	private setupScenarios() {
		// Scenario 1: Find class and its methods
		this.scenarios.set('find-calculator-class', [
			{
				content: 'Tôi sẽ tìm class Calculator trong codebase.',
				toolCalls: [
					{
						id: 'call_1',
						type: 'function',
						function: {
							name: 'symbol_search',
							arguments: JSON.stringify({
								namePattern: 'Calculator',
								substringMatching: false,
							}),
						},
					},
				],
			},
			{
				content:
					'Đã tìm thấy class Calculator. Bây giờ tôi sẽ lấy chi tiết các methods.',
				toolCalls: [
					{
						id: 'call_2',
						type: 'function',
						function: {
							name: 'symbol_search',
							arguments: JSON.stringify({
								namePattern: 'Calculator',
								depth: 1,
								includeBody: true,
							}),
						},
					},
				],
			},
			{
				content:
					'Class Calculator có các methods: add, subtract, multiply. Đây là thông tin chi tiết...',
			},
		]);

		// Scenario 2: Find references
		this.scenarios.set('find-references', [
			{
				content: 'Tôi sẽ tìm tất cả references đến Calculator.add method.',
				toolCalls: [
					{
						id: 'call_1',
						type: 'function',
						function: {
							name: 'find_references',
							arguments: JSON.stringify({
								namePath: 'Calculator/add',
								filePath: 'source/Calculator.ts',
							}),
						},
					},
				],
			},
			{
				content: 'Đã tìm thấy 3 references đến Calculator.add method:\n' +
					'1. source/example.ts:15\n' +
					'2. source/test.ts:22\n' +
					'3. source/app.ts:8',
			},
		]);

		// Scenario 3: Get symbols overview
		this.scenarios.set('get-overview', [
			{
				content: 'Tôi sẽ xem overview của file Calculator.ts.',
				toolCalls: [
					{
						id: 'call_1',
						type: 'function',
						function: {
							name: 'get_symbols_overview',
							arguments: JSON.stringify({
								filePath: 'source/Calculator.ts',
							}),
						},
					},
				],
			},
			{
				content:
					'File Calculator.ts chứa:\n' +
					'- 1 class: Calculator\n' +
					'- 3 methods: add, subtract, multiply\n' +
					'- 1 interface: CalculatorOptions',
			},
		]);

		// Scenario 4: Complex workflow với multiple tools
		this.scenarios.set('refactor-workflow', [
			{
				content:
					'Tôi sẽ bắt đầu refactor Calculator class. Đầu tiên xem overview.',
				toolCalls: [
					{
						id: 'call_1',
						type: 'function',
						function: {
							name: 'get_symbols_overview',
							arguments: JSON.stringify({
								filePath: 'source/Calculator.ts',
							}),
						},
					},
				],
			},
			{
				content: 'Bây giờ tôi sẽ tìm class Calculator.',
				toolCalls: [
					{
						id: 'call_2',
						type: 'function',
						function: {
							name: 'symbol_search',
							arguments: JSON.stringify({
								namePattern: 'Calculator',
								includeBody: true,
								depth: 1,
							}),
						},
					},
				],
			},
			{
				content: 'Kiểm tra references đến Calculator class.',
				toolCalls: [
					{
						id: 'call_3',
						type: 'function',
						function: {
							name: 'find_references',
							arguments: JSON.stringify({
								namePath: 'Calculator',
								filePath: 'source/Calculator.ts',
							}),
						},
					},
				],
			},
			{
				content:
					'Hoàn thành phân tích. Calculator class:\n' +
					'- Có 3 methods\n' +
					'- Được sử dụng ở 5 nơi\n' +
					'- Sẵn sàng để refactor',
			},
		]);
	}

	/**
	 * Start mock server
	 */
	async start(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.server = http.createServer((req, res) => {
				// Handle OPTIONS for CORS
				if (req.method === 'OPTIONS') {
					res.writeHead(200, {
						'Access-Control-Allow-Origin': '*',
						'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
						'Access-Control-Allow-Headers': 'Content-Type',
					});
					res.end();
					return;
				}

				// Only handle POST requests
				if (req.method !== 'POST') {
					res.writeHead(404);
					res.end('Not found');
					return;
				}

				let body = '';
				req.on('data', chunk => {
					body += chunk.toString();
				});

				req.on('end', () => {
					try {
						const request = JSON.parse(body);
						const response = this.handleRequest(request);

						res.writeHead(200, {
							'Content-Type': 'application/json',
							'Access-Control-Allow-Origin': '*',
						});
						res.end(JSON.stringify(response));
					} catch (error) {
						res.writeHead(500);
						res.end(
							JSON.stringify({
								error: 'Internal server error',
								message: error instanceof Error ? error.message : String(error),
							}),
						);
					}
				});
			});

			this.server.listen(this.port, () => {
				console.log(`Mock AI server listening on port ${this.port}`);
				resolve();
			});

			this.server.on('error', reject);
		});
	}

	/**
	 * Stop mock server
	 */
	async stop(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.server) {
				resolve();
				return;
			}

			this.server.close(error => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
		});
	}

	/**
	 * Handle mock request
	 */
	private handleRequest(request: any): any {
		const {scenario, step, toolResults} = request;

		// Get scenario responses
		const responses = this.scenarios.get(scenario);
		if (!responses) {
			return {
				error: `Unknown scenario: ${scenario}`,
			};
		}

		// Get response for step
		const currentStep = step || 0;
		if (currentStep >= responses.length) {
			return {
				content: 'Conversation complete',
				done: true,
			};
		}

		const response = responses[currentStep];

		// If tool results provided, include them in response
		if (toolResults && toolResults.length > 0) {
			return {
				...response,
				toolResults,
				nextStep: currentStep + 1,
			};
		}

		return {
			...response,
			nextStep: currentStep + 1,
		};
	}

	/**
	 * Get available scenarios
	 */
	getScenarios(): string[] {
		return Array.from(this.scenarios.keys());
	}
}

// CLI interface for testing
// ES module equivalent of require.main === module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
	const server = new MockAIServer(3456);

	server
		.start()
		.then(() => {
			console.log('Mock AI Server started successfully!');
			console.log('Available scenarios:');
			for (const scenario of server.getScenarios()) {
				console.log(`  - ${scenario}`);
			}
			console.log('\nPress Ctrl+C to stop');
		})
		.catch(error => {
			console.error('Failed to start server:', error);
			process.exit(1);
		});

	// Handle graceful shutdown
	process.on('SIGINT', () => {
		console.log('\nShutting down...');
		server.stop().then(() => {
			console.log('Server stopped');
			process.exit(0);
		});
	});
}
