/**
 * VS Code Extension Integration Tests
 * Tests for VSCodeExtension class
 */

import test from 'ava';
import {EventEmitter} from 'events';
import {
	VSCodeExtension,
	type VSCodeMessage,
	type VSCodeConfig,
} from '../../../source/infrastructure/integrations/vscode/VSCodeExtension.ts';

// Mock WebSocket for testing
class MockWebSocket extends EventEmitter {
	public readyState = 0; // CONNECTING
	public url: string;
	public sentMessages: string[] = [];

	constructor(url: string) {
		super();
		this.url = url;
	}

	send(data: string): void {
		this.sentMessages.push(data);
	}

	close(): void {
		this.readyState = 3; // CLOSED
		this.emit('close');
	}

	// Simulate opening connection
	simulateOpen(): void {
		this.readyState = 1; // OPEN
		this.emit('open');
	}

	// Simulate receiving message
	simulateMessage(message: VSCodeMessage): void {
		this.emit('message', JSON.stringify(message));
	}

	// Simulate error
	simulateError(error: Error): void {
		this.emit('error', error);
	}
}

// Helper to create mock VSCodeExtension with injected WebSocket
function createMockVSCodeExtension(config?: VSCodeConfig): {
	extension: VSCodeExtension;
	mockWs: MockWebSocket;
} {
	const extension = new VSCodeExtension(config);
	const mockWs = new MockWebSocket('ws://localhost:9000');

	// Override the connectWebSocket method to use our mock
	(extension as any).connectWebSocket = async function () {
		return new Promise((resolve, reject) => {
			this.ws = mockWs;

			mockWs.on('open', () => {
				this.connected = true;
				this.emit('connected');
				resolve(true);
			});

			mockWs.on('message', (data: string) => {
				try {
					const message: VSCodeMessage = JSON.parse(data.toString());
					this.handleMessage(message);
				} catch (error) {
					this.emit('error', error);
				}
			});

			mockWs.on('error', (error: Error) => {
				this.connected = false;
				this.emit('error', error);
				reject(error);
			});

			mockWs.on('close', () => {
				this.connected = false;
				this.emit('disconnected');
			});

			// Set timeout
			const timeout = setTimeout(() => {
				if (!this.connected) {
					reject(new Error('Connection timeout'));
				}
			}, this.config.timeout || 5000);

			// Auto-clear timeout if connected
			mockWs.on('open', () => clearTimeout(timeout));
		});
	};

	return {extension, mockWs};
}

// ========================================
// Initialization Tests
// ========================================

test('creates extension with default config', t => {
	const extension = new VSCodeExtension();
	t.truthy(extension);
	t.false(extension.isConnected());
});

test('creates extension with custom config', t => {
	const config: VSCodeConfig = {
		mode: 'websocket',
		port: 8000,
		timeout: 10000,
	};
	const extension = new VSCodeExtension(config);
	t.truthy(extension);
});

test('creates extension with stdio mode', t => {
	const config: VSCodeConfig = {
		mode: 'stdio',
	};
	const extension = new VSCodeExtension(config);
	t.truthy(extension);
});

// ========================================
// Connection Tests
// ========================================

test('connects to VS Code via WebSocket', async t => {
	const {extension, mockWs} = createMockVSCodeExtension();

	// Start connection in background
	const connectPromise = extension.connect();

	// Simulate successful connection
	mockWs.simulateOpen();

	const result = await connectPromise;
	t.true(result);
	t.true(extension.isConnected());
});

test('emits connected event on successful connection', async t => {
	const {extension, mockWs} = createMockVSCodeExtension();

	let connectedEmitted = false;
	extension.on('connected', () => {
		connectedEmitted = true;
	});

	const connectPromise = extension.connect();
	mockWs.simulateOpen();
	await connectPromise;

	t.true(connectedEmitted);
});

test('handles connection timeout', async t => {
	const config: VSCodeConfig = {
		mode: 'websocket',
		port: 9000,
		timeout: 100, // Short timeout
	};
	const {extension} = createMockVSCodeExtension(config);

	// Don't simulate open - let it timeout
	await t.throwsAsync(extension.connect(), {
		instanceOf: Error,
		message: /timeout/i,
	});
});

test.skip('handles connection error', async t => {
	// TODO: Fix race condition with event handler setup
	const {extension, mockWs} = createMockVSCodeExtension();

	const connectPromise = extension.connect();

	// Trigger error after a small delay to ensure promise is set up
	setTimeout(() => {
		mockWs.simulateError(new Error('Connection refused'));
	}, 10);

	await t.throwsAsync(connectPromise, {
		instanceOf: Error,
		message: /Connection refused/i,
	});
});

// ========================================
// Message Sending Tests
// ========================================

test('sends request message', async t => {
	const {extension, mockWs} = createMockVSCodeExtension();

	// Connect first
	const connectPromise = extension.connect();
	mockWs.simulateOpen();
	await connectPromise;

	// Send request
	const requestPromise = extension.sendRequest('test/method', {param: 'value'});

	// Check message was sent
	t.is(mockWs.sentMessages.length, 1);
	const sentMessage = JSON.parse(mockWs.sentMessages[0]);
	t.is(sentMessage.type, 'request');
	t.is(sentMessage.method, 'test/method');
	t.deepEqual(sentMessage.params, {param: 'value'});
	t.truthy(sentMessage.id);

	// Simulate response
	mockWs.simulateMessage({
		type: 'response',
		id: sentMessage.id,
		result: {success: true},
	});

	const result = await requestPromise;
	t.deepEqual(result, {success: true});
});

test('sends notification message', async t => {
	const {extension, mockWs} = createMockVSCodeExtension();

	const connectPromise = extension.connect();
	mockWs.simulateOpen();
	await connectPromise;

	extension.sendNotification('test/notification', {data: 'hello'});

	t.is(mockWs.sentMessages.length, 1);
	const sentMessage = JSON.parse(mockWs.sentMessages[0]);
	t.is(sentMessage.type, 'notification');
	t.is(sentMessage.method, 'test/notification');
	t.deepEqual(sentMessage.params, {data: 'hello'});
	t.is(sentMessage.id, undefined);
});

test('sends response to incoming request', async t => {
	const {extension, mockWs} = createMockVSCodeExtension();

	const connectPromise = extension.connect();
	mockWs.simulateOpen();
	await connectPromise;

	extension.sendResponse('request-123', {result: 'ok'});

	t.is(mockWs.sentMessages.length, 1);
	const sentMessage = JSON.parse(mockWs.sentMessages[0]);
	t.is(sentMessage.type, 'response');
	t.is(sentMessage.id, 'request-123');
	t.deepEqual(sentMessage.result, {result: 'ok'});
});

test('throws error when sending request without connection', async t => {
	const extension = new VSCodeExtension();

	await t.throwsAsync(extension.sendRequest('test/method'), {
		instanceOf: Error,
		message: /Not connected/i,
	});
});

// ========================================
// Message Receiving Tests
// ========================================

test('receives and handles response message', async t => {
	const {extension, mockWs} = createMockVSCodeExtension();

	const connectPromise = extension.connect();
	mockWs.simulateOpen();
	await connectPromise;

	const requestPromise = extension.sendRequest('test/method');
	const sentMessage = JSON.parse(mockWs.sentMessages[0]);

	// Simulate response
	mockWs.simulateMessage({
		type: 'response',
		id: sentMessage.id,
		result: {data: 'response data'},
	});

	const result = await requestPromise;
	t.deepEqual(result, {data: 'response data'});
});

test('receives and handles error response', async t => {
	const {extension, mockWs} = createMockVSCodeExtension();

	const connectPromise = extension.connect();
	mockWs.simulateOpen();
	await connectPromise;

	const requestPromise = extension.sendRequest('test/method');
	const sentMessage = JSON.parse(mockWs.sentMessages[0]);

	// Simulate error response
	mockWs.simulateMessage({
		type: 'response',
		id: sentMessage.id,
		error: {message: 'Something went wrong'},
	});

	await t.throwsAsync(requestPromise, {
		instanceOf: Error,
		message: /Something went wrong/i,
	});
});

test('receives and emits incoming request', async t => {
	const {extension, mockWs} = createMockVSCodeExtension();

	const connectPromise = extension.connect();
	mockWs.simulateOpen();
	await connectPromise;

	let receivedRequest: VSCodeMessage | null = null;
	extension.on('request', (msg: VSCodeMessage) => {
		receivedRequest = msg;
	});

	const incomingRequest: VSCodeMessage = {
		type: 'request',
		id: 'vscode-123',
		method: 'codeh/doSomething',
		params: {action: 'test'},
	};

	mockWs.simulateMessage(incomingRequest);

	// Wait a bit for event processing
	await new Promise(resolve => setTimeout(resolve, 10));

	t.truthy(receivedRequest);
	t.is(receivedRequest?.method, 'codeh/doSomething');
});

test('receives and emits notification', async t => {
	const {extension, mockWs} = createMockVSCodeExtension();

	const connectPromise = extension.connect();
	mockWs.simulateOpen();
	await connectPromise;

	let receivedNotification: VSCodeMessage | null = null;
	extension.on('notification', (msg: VSCodeMessage) => {
		receivedNotification = msg;
	});

	const notification: VSCodeMessage = {
		type: 'notification',
		method: 'vscode/fileChanged',
		params: {path: '/test.ts'},
	};

	mockWs.simulateMessage(notification);

	await new Promise(resolve => setTimeout(resolve, 10));

	t.truthy(receivedNotification);
	t.is(receivedNotification?.method, 'vscode/fileChanged');
});

// ========================================
// Request Timeout Tests
// ========================================

test('request times out if no response', async t => {
	const config: VSCodeConfig = {
		mode: 'websocket',
		timeout: 100, // Short timeout
	};
	const {extension, mockWs} = createMockVSCodeExtension(config);

	const connectPromise = extension.connect();
	mockWs.simulateOpen();
	await connectPromise;

	// Send request but don't respond
	const requestPromise = extension.sendRequest('test/method');

	await t.throwsAsync(requestPromise, {
		instanceOf: Error,
		message: /timeout/i,
	});
});

// ========================================
// Disconnect Tests
// ========================================

test('disconnects from VS Code', async t => {
	const {extension, mockWs} = createMockVSCodeExtension();

	const connectPromise = extension.connect();
	mockWs.simulateOpen();
	await connectPromise;

	t.true(extension.isConnected());

	let disconnectedEmitted = false;
	extension.on('disconnected', () => {
		disconnectedEmitted = true;
	});

	extension.disconnect();

	t.false(extension.isConnected());
	t.true(disconnectedEmitted);
});

test('rejects pending requests on disconnect', async t => {
	const {extension, mockWs} = createMockVSCodeExtension();

	const connectPromise = extension.connect();
	mockWs.simulateOpen();
	await connectPromise;

	const requestPromise = extension.sendRequest('test/method');

	// Disconnect without responding
	extension.disconnect();

	await t.throwsAsync(requestPromise, {
		instanceOf: Error,
		message: /Disconnected/i,
	});
});

test('handles WebSocket close event', async t => {
	const {extension, mockWs} = createMockVSCodeExtension();

	const connectPromise = extension.connect();
	mockWs.simulateOpen();
	await connectPromise;

	let disconnectedEmitted = false;
	extension.on('disconnected', () => {
		disconnectedEmitted = true;
	});

	// Simulate WebSocket close
	mockWs.close();

	t.false(extension.isConnected());
	t.true(disconnectedEmitted);
});

// ========================================
// VS Code API Method Tests
// ========================================

test('getCapabilities sends correct request', async t => {
	const {extension, mockWs} = createMockVSCodeExtension();

	const connectPromise = extension.connect();
	mockWs.simulateOpen();
	await connectPromise;

	const capabilitiesPromise = extension.getCapabilities();
	const sentMessage = JSON.parse(mockWs.sentMessages[0]);

	t.is(sentMessage.method, 'vscode/getCapabilities');

	mockWs.simulateMessage({
		type: 'response',
		id: sentMessage.id,
		result: {features: ['openFile', 'executeCommand'], version: '1.0.0'},
	});

	const result = await capabilitiesPromise;
	t.deepEqual(result.features, ['openFile', 'executeCommand']);
	t.is(result.version, '1.0.0');
});

test('openFile sends correct request', async t => {
	const {extension, mockWs} = createMockVSCodeExtension();

	const connectPromise = extension.connect();
	mockWs.simulateOpen();
	await connectPromise;

	const openFilePromise = extension.openFile('/path/to/file.ts', 10, 5);
	const sentMessage = JSON.parse(mockWs.sentMessages[0]);

	t.is(sentMessage.method, 'vscode/openFile');
	t.deepEqual(sentMessage.params, {
		path: '/path/to/file.ts',
		line: 10,
		column: 5,
	});

	mockWs.simulateMessage({
		type: 'response',
		id: sentMessage.id,
		result: undefined,
	});

	await openFilePromise;
	t.pass();
});

test('showMessage sends correct request', async t => {
	const {extension, mockWs} = createMockVSCodeExtension();

	const connectPromise = extension.connect();
	mockWs.simulateOpen();
	await connectPromise;

	const showMessagePromise = extension.showMessage('Hello VS Code', 'warning');
	const sentMessage = JSON.parse(mockWs.sentMessages[0]);

	t.is(sentMessage.method, 'vscode/showMessage');
	t.deepEqual(sentMessage.params, {
		message: 'Hello VS Code',
		type: 'warning',
	});

	mockWs.simulateMessage({
		type: 'response',
		id: sentMessage.id,
		result: undefined,
	});

	await showMessagePromise;
	t.pass();
});

test('executeCommand sends correct request', async t => {
	const {extension, mockWs} = createMockVSCodeExtension();

	const connectPromise = extension.connect();
	mockWs.simulateOpen();
	await connectPromise;

	const executePromise = extension.executeCommand(
		'workbench.action.files.save',
		['/path/to/file.ts'],
	);
	const sentMessage = JSON.parse(mockWs.sentMessages[0]);

	t.is(sentMessage.method, 'vscode/executeCommand');
	t.deepEqual(sentMessage.params, {
		command: 'workbench.action.files.save',
		args: ['/path/to/file.ts'],
	});

	mockWs.simulateMessage({
		type: 'response',
		id: sentMessage.id,
		result: {success: true},
	});

	const result = await executePromise;
	t.deepEqual(result, {success: true});
});

// ========================================
// Error Handling Tests
// ========================================

test('handles malformed JSON in received message', async t => {
	const {extension, mockWs} = createMockVSCodeExtension();

	const connectPromise = extension.connect();
	mockWs.simulateOpen();
	await connectPromise;

	let errorEmitted = false;
	extension.on('error', () => {
		errorEmitted = true;
	});

	// Simulate malformed JSON
	mockWs.emit('message', 'invalid json {{{');

	await new Promise(resolve => setTimeout(resolve, 10));

	t.true(errorEmitted);
});

test('handles multiple concurrent requests', async t => {
	const {extension, mockWs} = createMockVSCodeExtension();

	const connectPromise = extension.connect();
	mockWs.simulateOpen();
	await connectPromise;

	// Send multiple requests
	const promise1 = extension.sendRequest('method1');
	const promise2 = extension.sendRequest('method2');
	const promise3 = extension.sendRequest('method3');

	// Get all message IDs
	const msg1 = JSON.parse(mockWs.sentMessages[0]);
	const msg2 = JSON.parse(mockWs.sentMessages[1]);
	const msg3 = JSON.parse(mockWs.sentMessages[2]);

	// Respond in different order
	mockWs.simulateMessage({type: 'response', id: msg2.id, result: 'result2'});
	mockWs.simulateMessage({type: 'response', id: msg1.id, result: 'result1'});
	mockWs.simulateMessage({type: 'response', id: msg3.id, result: 'result3'});

	const [result1, result2, result3] = await Promise.all([
		promise1,
		promise2,
		promise3,
	]);

	t.is(result1, 'result1');
	t.is(result2, 'result2');
	t.is(result3, 'result3');
});
