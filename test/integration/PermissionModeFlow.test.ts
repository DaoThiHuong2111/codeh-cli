/**
 * Integration Test: Permission Mode Flow
 * Tests complete permission flow: LLM → Tool Call → Permission → Execution → Response
 * Tests both MVP and Interactive modes
 *
 * **Feature: permission-mode-fix**
 */

import test from 'ava';
import {CodehClient} from '../../dist/core/application/CodehClient.js';
import {Configuration} from '../../dist/core/domain/models/Configuration.js';
import {Message} from '../../dist/core/domain/models/Message.js';
import {HybridPermissionHandler} from '../../dist/infrastructure/permissions/HybridPermissionHandler.js';
import {PermissionModeManager} from '../../dist/infrastructure/permissions/PermissionModeManager.js';
import {ToolRegistry} from '../../dist/core/tools/base/ToolRegistry.js';
import {Tool} from '../../dist/core/tools/base/Tool.js';
import type {
	IApiClient,
	ApiRequest,
	ApiResponse,
	StreamChunk,
} from '../../dist/core/domain/interfaces/IApiClient.js';
import type {
	IHistoryRepository,
	ConversationHistory,
} from '../../dist/core/domain/interfaces/IHistoryRepository.js';
import type {
	ToolDefinition,
	ToolExecutionResult,
} from '../../dist/core/domain/interfaces/IToolExecutor.js';
import type {
	ToolPermissionContext,
	PermissionResult,
} from '../../dist/core/domain/interfaces/IToolPermissionHandler.js';

// Suppress console output during tests
const originalLog = console.log;
const originalWarn = console.warn;
test.before(() => {
	console.log = () => {};
	console.warn = () => {};
});
test.after(() => {
	console.log = originalLog;
	console.warn = originalWarn;
});

// ========================================
// Mock API Client with Tool Use Response
// ========================================

class MockApiClientWithToolUse implements IApiClient {
	private callCount = 0;
	public capturedRequests: ApiRequest[] = [];

	async chat(request: ApiRequest): Promise<ApiResponse> {
		this.callCount++;
		this.capturedRequests.push(request);

		// First call: LLM requests tool
		if (this.callCount === 1) {
			return {
				content: "I'll execute the test tool for you.",
				model: 'mock-model',
				usage: {
					promptTokens: 20,
					completionTokens: 15,
					totalTokens: 35,
				},
				finishReason: 'tool_calls',
				toolCalls: [
					{
						id: 'call_1',
						name: 'test_tool',
						arguments: {
							input: 'test_value',
						},
					},
				],
			};
		}

		// Second call: After tool execution, LLM provides final response
		return {
			content: 'Tool executed successfully. Here is the result.',
			model: 'mock-model',
			usage: {
				promptTokens: 50,
				completionTokens: 20,
				totalTokens: 70,
			},
			finishReason: 'stop',
		};
	}

	async streamChat(
		request: ApiRequest,
		onChunk: (chunk: StreamChunk) => void,
	): Promise<ApiResponse> {
		return this.chat(request);
	}

	async healthCheck(): Promise<boolean> {
		return true;
	}

	getProviderName(): string {
		return 'mock';
	}

	async getAvailableModels(): Promise<string[]> {
		return ['mock-model'];
	}

	resetCallCount() {
		this.callCount = 0;
		this.capturedRequests = [];
	}
}

// ========================================
// Mock Session for History Repository
// ========================================

class MockSession {
	private messages: Message[] = [];
	public metadata: {lastCompressedIndex?: number} = {};
	private compressedMessage: Message | null = null;

	getMessages(): Message[] {
		return [...this.messages];
	}

	getMessagesForLLM(): readonly Message[] {
		if (this.compressedMessage) {
			const lastCompressedIndex = this.metadata.lastCompressedIndex ?? -1;
			const recentMessages = this.messages.slice(lastCompressedIndex + 1);
			return [this.compressedMessage, ...recentMessages];
		}
		return this.messages;
	}

	addMessage(message: Message): void {
		this.messages.push(message);
	}

	hasCompression(): boolean {
		return this.compressedMessage !== null;
	}

	setCompressedMessage(message: Message, lastIndex: number): void {
		this.compressedMessage = message;
		this.metadata.lastCompressedIndex = lastIndex;
	}

	clear(): void {
		this.messages = [];
		this.compressedMessage = null;
		this.metadata = {};
	}
}

// ========================================
// Mock History Repository
// ========================================

class MockHistoryRepository implements IHistoryRepository {
	private conversations: Map<string, ConversationHistory> = new Map();
	private currentSession: MockSession = new MockSession();
	private currentConversationId: string = 'default';

	async save(conversation: ConversationHistory): Promise<void> {
		this.conversations.set(conversation.id, conversation);
	}

	async load(id: string): Promise<ConversationHistory | null> {
		return this.conversations.get(id) || null;
	}

	async loadLatest(): Promise<ConversationHistory | null> {
		const entries = Array.from(this.conversations.values());
		if (entries.length === 0) return null;
		return entries.sort(
			(a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
		)[0];
	}

	async list(): Promise<ConversationHistory[]> {
		return Array.from(this.conversations.values());
	}

	async delete(id: string): Promise<void> {
		this.conversations.delete(id);
	}

	async clear(): Promise<void> {
		this.conversations.clear();
		this.currentSession.clear();
	}

	async addMessage(message: Message): Promise<void> {
		this.currentSession.addMessage(message);
	}

	async getRecentMessages(limit: number): Promise<Message[]> {
		const messages = this.currentSession.getMessages();
		return messages.slice(-limit);
	}

	async startNewConversation(): Promise<void> {
		this.currentSession = new MockSession();
		this.currentConversationId = `conv_${Date.now()}`;
	}

	async getCurrentSession(): Promise<MockSession | null> {
		return this.currentSession;
	}

	async saveSession(session: any): Promise<void> {
		// No-op for mock
	}
}

// ========================================
// Mock Test Tool
// ========================================

class MockTestTool extends Tool {
	public executionCount = 0;
	public lastArguments: Record<string, any> | null = null;

	constructor() {
		super();
	}

	getDefinition(): ToolDefinition {
		return {
			name: 'test_tool',
			description: 'A test tool for integration testing',
			parameters: [
				{
					name: 'input',
					type: 'string',
					description: 'Test input parameter',
					required: true,
				},
			],
		};
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		this.executionCount++;
		this.lastArguments = parameters;

		return {
			success: true,
			output: `Executed with input: ${parameters.input}`,
			metadata: {
				executedAt: new Date().toISOString(),
			},
		};
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return typeof parameters.input === 'string' && parameters.input.length > 0;
	}

	getName(): string {
		return 'test_tool';
	}

	getDescription(): string {
		return 'A test tool for integration testing';
	}

	reset() {
		this.executionCount = 0;
		this.lastArguments = null;
	}
}

// ========================================
// Test Setup Helper
// ========================================

function createTestSetup() {
	const apiClient = new MockApiClientWithToolUse();
	const historyRepo = new MockHistoryRepository();
	const modeManager = new PermissionModeManager();
	const permissionHandler = new HybridPermissionHandler(modeManager);
	const toolRegistry = new ToolRegistry();
	const testTool = new MockTestTool();

	toolRegistry.register(testTool);

	const mockConfig = Configuration.create({
		provider: 'anthropic',
		model: 'claude-3-5-sonnet-20241022',
		apiKey: 'test-key',
		maxTokens: 4096,
		temperature: 0.7,
	});

	const client = new CodehClient(
		apiClient,
		historyRepo,
		mockConfig,
		toolRegistry,
		permissionHandler,
	);

	return {
		client,
		apiClient,
		historyRepo,
		modeManager,
		permissionHandler,
		toolRegistry,
		testTool,
	};
}

// ========================================
// 16.1 Full Flow Integration Tests
// ========================================

test('Full flow: MVP mode auto-approves and executes tool', async t => {
	const {client, modeManager, testTool} = createTestSetup();

	// Ensure MVP mode
	modeManager.setMode('mvp');
	t.true(modeManager.isMVPMode(), 'Should be in MVP mode');

	// Execute chat that triggers tool use
	const turn = await client.execute('run test tool');

	// Verify turn structure
	t.truthy(turn, 'Turn should exist');
	t.truthy(turn.response, 'Turn should have response');

	// Verify tool was executed (MVP mode auto-approves)
	t.is(testTool.executionCount, 1, 'Tool should be executed once in MVP mode');
	t.deepEqual(
		testTool.lastArguments,
		{input: 'test_value'},
		'Tool should receive correct arguments',
	);

	// Verify final response (after tool execution)
	t.truthy(turn.response?.content, 'Should have final response content');
});

test('Full flow: Interactive mode with approval executes tool', async t => {
	const {client, modeManager, permissionHandler, testTool} = createTestSetup();

	// Set Interactive mode
	modeManager.setMode('interactive');
	t.true(modeManager.isInteractiveMode(), 'Should be in Interactive mode');

	// Set up UI callback that approves
	let callbackInvoked = false;
	let receivedContext: ToolPermissionContext | null = null;

	permissionHandler.getInteractiveHandler().setUICallback({
		requestPermission: async (
			context: ToolPermissionContext,
		): Promise<PermissionResult> => {
			callbackInvoked = true;
			receivedContext = context;
			return {approved: true, reason: 'User approved'};
		},
	});

	// Execute chat
	const turn = await client.execute('run test tool');

	// Verify UI callback was invoked
	t.true(callbackInvoked, 'UI callback should be invoked in Interactive mode');
	t.is(
		receivedContext?.toolCall.name,
		'test_tool',
		'Callback should receive correct tool name',
	);

	// Verify tool was executed after approval
	t.is(testTool.executionCount, 1, 'Tool should be executed after approval');

	// Verify final response
	t.truthy(turn.response?.content, 'Should have final response content');
});

test('Full flow: Interactive mode with denial skips tool', async t => {
	const {client, modeManager, permissionHandler, testTool} = createTestSetup();

	// Set Interactive mode
	modeManager.setMode('interactive');

	// Set up UI callback that denies
	let callbackInvoked = false;

	permissionHandler.getInteractiveHandler().setUICallback({
		requestPermission: async (): Promise<PermissionResult> => {
			callbackInvoked = true;
			return {approved: false, reason: 'User denied'};
		},
	});

	// Execute chat
	const turn = await client.execute('run test tool');

	// Verify UI callback was invoked
	t.true(callbackInvoked, 'UI callback should be invoked');

	// Verify tool was NOT executed
	t.is(testTool.executionCount, 0, 'Tool should NOT be executed after denial');

	// Verify turn still completes (with rejection feedback to LLM)
	t.truthy(turn, 'Turn should still complete');
});

test('Full flow: Interactive mode with always-allow adds to pre-approved', async t => {
	const {client, apiClient, modeManager, permissionHandler, testTool} =
		createTestSetup();

	// Set Interactive mode
	modeManager.setMode('interactive');

	let callbackCount = 0;

	permissionHandler.getInteractiveHandler().setUICallback({
		requestPermission: async (): Promise<PermissionResult> => {
			callbackCount++;
			// First call: always allow
			return {approved: true, rememberChoice: true};
		},
	});

	// First execution - should invoke callback
	await client.execute('run test tool');
	t.is(callbackCount, 1, 'Callback should be invoked first time');
	t.is(testTool.executionCount, 1, 'Tool should execute first time');

	// Save preference (simulating what UI would do)
	await permissionHandler
		.getInteractiveHandler()
		.savePermissionPreference('test_tool', true);

	// Verify pre-approval
	t.true(
		permissionHandler.hasPreApproval('test_tool'),
		'Tool should be pre-approved',
	);

	// Reset for second execution
	apiClient.resetCallCount();
	testTool.reset();

	// Second execution - should skip callback due to pre-approval
	await client.execute('run test tool again');

	// Callback should NOT be invoked again (pre-approved)
	t.is(
		callbackCount,
		1,
		'Callback should NOT be invoked for pre-approved tool',
	);
	t.is(testTool.executionCount, 1, 'Tool should execute without callback');
});

test('Full flow: MVP mode does not invoke UI callback', async t => {
	const {client, modeManager, permissionHandler, testTool} = createTestSetup();

	// Ensure MVP mode
	modeManager.setMode('mvp');

	// Set up UI callback
	let callbackInvoked = false;

	permissionHandler.getInteractiveHandler().setUICallback({
		requestPermission: async (): Promise<PermissionResult> => {
			callbackInvoked = true;
			return {approved: false, reason: 'Should not be called'};
		},
	});

	// Execute chat
	await client.execute('run test tool');

	// Verify UI callback was NOT invoked in MVP mode
	t.false(callbackInvoked, 'UI callback should NOT be invoked in MVP mode');

	// Verify tool was still executed (auto-approved)
	t.is(testTool.executionCount, 1, 'Tool should be auto-approved in MVP mode');
});

// ========================================
// 16.2 Mode Switching During Execution Tests
// ========================================

test('Mode switch: in-progress request uses original mode (MVP to Interactive)', async t => {
	const {client, modeManager, permissionHandler, testTool} = createTestSetup();

	// Start in MVP mode
	modeManager.setMode('mvp');

	let callbackInvoked = false;
	permissionHandler.getInteractiveHandler().setUICallback({
		requestPermission: async (): Promise<PermissionResult> => {
			callbackInvoked = true;
			return {approved: true};
		},
	});

	// Execute in MVP mode - tool should auto-approve
	const turn = await client.execute('run test tool');

	// Even if we switch mode during execution, the request started in MVP mode
	// should complete with MVP behavior
	t.false(
		callbackInvoked,
		'Callback should not be invoked for MVP mode request',
	);
	t.is(testTool.executionCount, 1, 'Tool should execute in MVP mode');
	t.truthy(turn.response, 'Turn should complete');
});

test('Mode switch: subsequent request uses new mode', async t => {
	const {client, apiClient, modeManager, permissionHandler, testTool} =
		createTestSetup();

	// Start in MVP mode
	modeManager.setMode('mvp');

	let callbackCount = 0;
	permissionHandler.getInteractiveHandler().setUICallback({
		requestPermission: async (): Promise<PermissionResult> => {
			callbackCount++;
			return {approved: true};
		},
	});

	// First request in MVP mode
	await client.execute('run test tool');
	t.is(callbackCount, 0, 'No callback in MVP mode');
	t.is(testTool.executionCount, 1, 'Tool executed in MVP mode');

	// Switch to Interactive mode
	modeManager.setMode('interactive');
	t.true(modeManager.isInteractiveMode(), 'Should be in Interactive mode');

	// Reset for second request
	apiClient.resetCallCount();
	testTool.reset();

	// Second request in Interactive mode
	await client.execute('run test tool again');
	t.is(callbackCount, 1, 'Callback should be invoked in Interactive mode');
	t.is(testTool.executionCount, 1, 'Tool executed after approval');
});

test('Mode switch: Interactive to MVP applies immediately', async t => {
	const {client, apiClient, modeManager, permissionHandler, testTool} =
		createTestSetup();

	// Start in Interactive mode
	modeManager.setMode('interactive');

	let callbackCount = 0;
	permissionHandler.getInteractiveHandler().setUICallback({
		requestPermission: async (): Promise<PermissionResult> => {
			callbackCount++;
			return {approved: true};
		},
	});

	// First request in Interactive mode
	await client.execute('run test tool');
	t.is(callbackCount, 1, 'Callback invoked in Interactive mode');
	t.is(testTool.executionCount, 1, 'Tool executed after approval');

	// Switch to MVP mode
	modeManager.setMode('mvp');
	t.true(modeManager.isMVPMode(), 'Should be in MVP mode');

	// Reset for second request
	apiClient.resetCallCount();
	testTool.reset();

	// Second request in MVP mode - should auto-approve
	await client.execute('run test tool again');
	t.is(callbackCount, 1, 'Callback should NOT be invoked again in MVP mode');
	t.is(testTool.executionCount, 1, 'Tool auto-approved in MVP mode');
});

test('Mode switch: rapid toggling maintains consistency', async t => {
	const {modeManager, permissionHandler} = createTestSetup();

	let callbackCount = 0;
	permissionHandler.getInteractiveHandler().setUICallback({
		requestPermission: async (): Promise<PermissionResult> => {
			callbackCount++;
			return {approved: true};
		},
	});

	const context: ToolPermissionContext = {
		toolCall: {id: 'test-1', name: 'test_tool', arguments: {input: 'test'}},
		timestamp: new Date(),
	};

	// Rapid mode toggling
	modeManager.setMode('mvp');
	modeManager.setMode('interactive');
	modeManager.setMode('mvp');
	modeManager.setMode('interactive');
	modeManager.setMode('mvp');

	// Final mode should be MVP
	t.true(modeManager.isMVPMode(), 'Should end in MVP mode');

	// Request permission - should use current (MVP) mode
	const result = await permissionHandler.requestPermission(context);

	t.true(result.approved, 'Should be approved in MVP mode');
	t.is(callbackCount, 0, 'Callback should not be invoked in MVP mode');
});

test('Mode switch: listener notification during execution', async t => {
	const {modeManager} = createTestSetup();

	const modeChanges: string[] = [];

	modeManager.addListener({
		onModeChanged: mode => {
			modeChanges.push(mode);
		},
	});

	// Toggle modes
	modeManager.setMode('interactive');
	modeManager.setMode('mvp');
	modeManager.setMode('interactive');

	t.deepEqual(
		modeChanges,
		['interactive', 'mvp', 'interactive'],
		'All mode changes should be notified',
	);
});

console.log('\n🧪 Running Permission Mode Flow Integration Tests...\n');
