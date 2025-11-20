/**
 * MCP Client Tests
 * Tests for MCPClient class (Model Context Protocol)
 */

import test from 'ava';
import {EventEmitter} from 'events';
import type {ChildProcess} from 'child_process';
import {
	MCPClient,
	type MCPServer,
	type MCPResource,
	type MCPTool,
	type MCPPrompt,
} from '../../../source/infrastructure/integrations/mcp/MCPClient.ts';

// Mock ChildProcess for testing
class MockChildProcess extends EventEmitter {
	public stdin: MockWritableStream;
	public stdout: MockReadableStream;
	public stderr: MockReadableStream;
	public killed = false;

	constructor() {
		super();
		this.stdin = new MockWritableStream();
		this.stdout = new MockReadableStream();
		this.stderr = new MockReadableStream();
	}

	kill(): boolean {
		this.killed = true;
		this.emit('exit', 0);
		return true;
	}
}

class MockWritableStream extends EventEmitter {
	public writtenData: string[] = [];

	write(data: string): boolean {
		this.writtenData.push(data);
		return true;
	}
}

class MockReadableStream extends EventEmitter {
	public simulateData(line: string): void {
		this.emit('data', line + '\n');
	}
}

// Helper to create MCPClient with mocked spawn
function createMockMCPClient(): {
	client: MCPClient;
	mockProcess: MockChildProcess;
} {
	const client = new MCPClient();
	const mockProcess = new MockChildProcess();

	// Mock spawn function
	const originalSpawn = require('child_process').spawn;
	require('child_process').spawn = () => mockProcess;

	return {client, mockProcess};
}

// Restore original spawn after each test
test.afterEach(() => {
	// This is a simple restore - in real scenario might need better cleanup
});

// ========================================
// Initialization Tests
// ========================================

test('creates MCP client', t => {
	const client = new MCPClient();
	t.truthy(client);
	t.deepEqual(client.getConnectedServers(), []);
});

// ========================================
// Server Connection Tests
// ========================================

test('connects to MCP server', async t => {
	const {client, mockProcess} = createMockMCPClient();

	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	// Start connection
	const connectPromise = client.connectToServer(serverConfig);

	// Simulate initialize response
	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {
					protocolVersion: '2024-11-05',
					capabilities: {
						resources: {},
						tools: {},
					},
					serverInfo: {
						name: 'test-server',
						version: '1.0.0',
					},
				},
			}),
		);
	}, 10);

	await connectPromise;

	t.true(client.isConnected('test-server'));
	t.deepEqual(client.getConnectedServers(), ['test-server']);
});

test('emits serverConnected event on successful connection', async t => {
	const {client, mockProcess} = createMockMCPClient();

	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	let connectedEvent: any = null;
	client.on('serverConnected', event => {
		connectedEvent = event;
	});

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;

	t.truthy(connectedEvent);
	t.is(connectedEvent.server, 'test-server');
});

test('throws error when connecting to already connected server', async t => {
	const {client, mockProcess} = createMockMCPClient();

	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	// First connection
	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;

	// Second connection attempt
	await t.throwsAsync(client.connectToServer(serverConfig), {
		instanceOf: Error,
		message: /already connected/i,
	});
});

test('passes environment variables to server process', async t => {
	const {client, mockProcess} = createMockMCPClient();

	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
		env: {
			CUSTOM_VAR: 'custom-value',
			API_KEY: 'secret',
		},
	};

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;
	t.pass();
});

// ========================================
// Resource Operations Tests
// ========================================

test('lists resources from server', async t => {
	const {client, mockProcess} = createMockMCPClient();

	// Connect first
	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;

	// Now list resources
	const listPromise = client.listResources('test-server');

	setTimeout(() => {
		const listMessage =
			mockProcess.stdin.writtenData[mockProcess.stdin.writtenData.length - 1];
		const parsed = JSON.parse(listMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {
					resources: [
						{
							uri: 'file:///project/readme.md',
							name: 'README',
							description: 'Project documentation',
							mimeType: 'text/markdown',
						},
						{
							uri: 'file:///project/package.json',
							name: 'Package Info',
						},
					],
				},
			}),
		);
	}, 10);

	const resources = await listPromise;

	t.is(resources.length, 2);
	t.is(resources[0].uri, 'file:///project/readme.md');
	t.is(resources[0].name, 'README');
});

test('reads resource content', async t => {
	const {client, mockProcess} = createMockMCPClient();

	// Setup connected server
	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;

	// Read resource
	const readPromise = client.readResource(
		'test-server',
		'file:///project/readme.md',
	);

	setTimeout(() => {
		const readMessage =
			mockProcess.stdin.writtenData[mockProcess.stdin.writtenData.length - 1];
		const parsed = JSON.parse(readMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {
					contents: {
						uri: 'file:///project/readme.md',
						mimeType: 'text/markdown',
						text: '# Project\n\nThis is a test project.',
					},
				},
			}),
		);
	}, 10);

	const content = await readPromise;

	t.truthy(content);
	t.is(content.text, '# Project\n\nThis is a test project.');
});

test('throws error when listing resources from disconnected server', async t => {
	const client = new MCPClient();

	await t.throwsAsync(client.listResources('non-existent-server'), {
		instanceOf: Error,
		message: /not connected/i,
	});
});

// ========================================
// Tool Operations Tests
// ========================================

test('lists tools from server', async t => {
	const {client, mockProcess} = createMockMCPClient();

	// Setup connection
	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;

	// List tools
	const listPromise = client.listTools('test-server');

	setTimeout(() => {
		const listMessage =
			mockProcess.stdin.writtenData[mockProcess.stdin.writtenData.length - 1];
		const parsed = JSON.parse(listMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {
					tools: [
						{
							name: 'read_file',
							description: 'Read a file from the project',
							inputSchema: {
								type: 'object',
								properties: {
									path: {type: 'string'},
								},
								required: ['path'],
							},
						},
						{
							name: 'write_file',
							description: 'Write content to a file',
							inputSchema: {
								type: 'object',
								properties: {
									path: {type: 'string'},
									content: {type: 'string'},
								},
								required: ['path', 'content'],
							},
						},
					],
				},
			}),
		);
	}, 10);

	const tools = await listPromise;

	t.is(tools.length, 2);
	t.is(tools[0].name, 'read_file');
	t.truthy(tools[0].inputSchema);
});

test('calls tool on server', async t => {
	const {client, mockProcess} = createMockMCPClient();

	// Setup connection
	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;

	// Call tool
	const callPromise = client.callTool('test-server', 'read_file', {
		path: '/test.txt',
	});

	setTimeout(() => {
		const callMessage =
			mockProcess.stdin.writtenData[mockProcess.stdin.writtenData.length - 1];
		const parsed = JSON.parse(callMessage);

		t.is(parsed.method, 'tools/call');
		t.is(parsed.params.name, 'read_file');
		t.deepEqual(parsed.params.arguments, {path: '/test.txt'});

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {
					content: [{type: 'text', text: 'File content here'}],
				},
			}),
		);
	}, 10);

	const result = await callPromise;

	t.truthy(result);
	t.truthy(result.content);
});

test('handles tool execution error', async t => {
	const {client, mockProcess} = createMockMCPClient();

	// Setup connection
	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;

	// Call tool
	const callPromise = client.callTool('test-server', 'invalid_tool', {});

	setTimeout(() => {
		const callMessage =
			mockProcess.stdin.writtenData[mockProcess.stdin.writtenData.length - 1];
		const parsed = JSON.parse(callMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				error: {
					code: -32601,
					message: 'Tool not found',
				},
			}),
		);
	}, 10);

	await t.throwsAsync(callPromise, {
		instanceOf: Error,
		message: /Tool not found/i,
	});
});

// ========================================
// Prompt Operations Tests
// ========================================

test('lists prompts from server', async t => {
	const {client, mockProcess} = createMockMCPClient();

	// Setup connection
	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;

	// List prompts
	const listPromise = client.listPrompts('test-server');

	setTimeout(() => {
		const listMessage =
			mockProcess.stdin.writtenData[mockProcess.stdin.writtenData.length - 1];
		const parsed = JSON.parse(listMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {
					prompts: [
						{
							name: 'code-review',
							description: 'Review code for issues',
							arguments: [
								{name: 'file', description: 'File to review', required: true},
							],
						},
					],
				},
			}),
		);
	}, 10);

	const prompts = await listPromise;

	t.is(prompts.length, 1);
	t.is(prompts[0].name, 'code-review');
});

test('gets prompt with arguments', async t => {
	const {client, mockProcess} = createMockMCPClient();

	// Setup connection
	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;

	// Get prompt
	const getPromise = client.getPrompt('test-server', 'code-review', {
		file: 'test.ts',
	});

	setTimeout(() => {
		const getMessage =
			mockProcess.stdin.writtenData[mockProcess.stdin.writtenData.length - 1];
		const parsed = JSON.parse(getMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {
					messages: [
						{
							role: 'user',
							content: {type: 'text', text: 'Review the file test.ts'},
						},
					],
				},
			}),
		);
	}, 10);

	const result = await getPromise;

	t.truthy(result);
	t.truthy(result.messages);
});

// ========================================
// Server Management Tests
// ========================================

test('gets server capabilities', async t => {
	const {client, mockProcess} = createMockMCPClient();

	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {
					capabilities: {
						resources: {listChanged: true},
						tools: {},
					},
				},
			}),
		);
	}, 10);

	await connectPromise;

	const capabilities = client.getCapabilities('test-server');

	t.truthy(capabilities);
	t.truthy(capabilities.capabilities.resources);
});

test('checks if server is connected', async t => {
	const {client, mockProcess} = createMockMCPClient();

	t.false(client.isConnected('test-server'));

	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;

	t.true(client.isConnected('test-server'));
});

test('gets list of connected servers', async t => {
	const {client, mockProcess} = createMockMCPClient();

	t.deepEqual(client.getConnectedServers(), []);

	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;

	const connected = client.getConnectedServers();
	t.deepEqual(connected, ['test-server']);
});

// ========================================
// Disconnection Tests
// ========================================

test('disconnects from server', async t => {
	const {client, mockProcess} = createMockMCPClient();

	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;

	t.true(client.isConnected('test-server'));

	let disconnectEvent: any = null;
	client.on('serverDisconnected', event => {
		disconnectEvent = event;
	});

	await client.disconnect('test-server');

	t.false(client.isConnected('test-server'));
	t.truthy(disconnectEvent);
	t.is(disconnectEvent.server, 'test-server');
	t.true(mockProcess.killed);
});

test('rejects pending requests on disconnect', async t => {
	const {client, mockProcess} = createMockMCPClient();

	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;

	// Make a request but don't respond
	const listPromise = client.listTools('test-server');

	// Disconnect immediately
	await client.disconnect('test-server');

	await t.throwsAsync(listPromise, {
		instanceOf: Error,
		message: /disconnected/i,
	});
});

test('disconnects from all servers', async t => {
	const {client, mockProcess} = createMockMCPClient();

	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;

	await client.disconnectAll();

	t.deepEqual(client.getConnectedServers(), []);
});

// ========================================
// Error Handling Tests
// ========================================

test('handles server process exit', async t => {
	const {client, mockProcess} = createMockMCPClient();

	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;

	let exitEvent: any = null;
	client.on('serverDisconnected', event => {
		exitEvent = event;
	});

	// Simulate process exit
	mockProcess.emit('exit', 1);

	await new Promise(resolve => setTimeout(resolve, 10));

	t.truthy(exitEvent);
	t.is(exitEvent.server, 'test-server');
	t.is(exitEvent.code, 1);
	t.false(client.isConnected('test-server'));
});

test('handles malformed JSON from server', async t => {
	const {client, mockProcess} = createMockMCPClient();

	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;

	let errorEvent: any = null;
	client.on('error', event => {
		errorEvent = event;
	});

	// Simulate malformed JSON
	mockProcess.stdout.simulateData('invalid json {{{');

	await new Promise(resolve => setTimeout(resolve, 10));

	t.truthy(errorEvent);
	t.is(errorEvent.server, 'test-server');
});

test('emits server logs', async t => {
	const {client, mockProcess} = createMockMCPClient();

	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;

	let logEvent: any = null;
	client.on('serverLog', event => {
		logEvent = event;
	});

	// Simulate stderr log
	mockProcess.stderr.emit('data', 'Debug: Server started');

	await new Promise(resolve => setTimeout(resolve, 10));

	t.truthy(logEvent);
	t.is(logEvent.server, 'test-server');
	t.regex(logEvent.log, /Server started/);
});

test('handles notification from server', async t => {
	const {client, mockProcess} = createMockMCPClient();

	const serverConfig: MCPServer = {
		name: 'test-server',
		command: 'node',
		args: ['server.js'],
	};

	const connectPromise = client.connectToServer(serverConfig);

	setTimeout(() => {
		const initMessage = mockProcess.stdin.writtenData[0];
		const parsed = JSON.parse(initMessage);

		mockProcess.stdout.simulateData(
			JSON.stringify({
				jsonrpc: '2.0',
				id: parsed.id,
				result: {capabilities: {}},
			}),
		);
	}, 10);

	await connectPromise;

	let notificationEvent: any = null;
	client.on('notification', event => {
		notificationEvent = event;
	});

	// Simulate notification
	mockProcess.stdout.simulateData(
		JSON.stringify({
			jsonrpc: '2.0',
			method: 'notifications/resources/list_changed',
			params: {},
		}),
	);

	await new Promise(resolve => setTimeout(resolve, 10));

	t.truthy(notificationEvent);
	t.is(notificationEvent.server, 'test-server');
	t.is(notificationEvent.method, 'notifications/resources/list_changed');
});
