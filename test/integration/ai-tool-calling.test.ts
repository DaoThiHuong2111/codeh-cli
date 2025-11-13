/**
 * E2E Test: AI Tool Calling with Symbol Tools
 * Tests complete AI-driven workflow: AI discovers tools, calls them, receives results
 */

import test from 'ava';
import * as path from 'path';
import {CodehClient} from '../../dist/core/application/CodehClient.js';
import {ToolRegistry} from '../../dist/core/tools/base/ToolRegistry.js';
import {SymbolSearchTool} from '../../dist/core/tools/SymbolSearchTool.js';
import {FindReferencesTool} from '../../dist/core/tools/FindReferencesTool.js';
import {GetSymbolsOverviewTool} from '../../dist/core/tools/GetSymbolsOverviewTool.js';
import type {
	IApiClient,
	ApiRequest,
	ApiResponse,
	StreamChunk,
} from '../../dist/core/domain/interfaces/IApiClient.js';
import type {IHistoryRepository} from '../../dist/core/domain/interfaces/IHistoryRepository.js';
import type {IToolPermissionHandler} from '../../dist/core/domain/interfaces/IToolPermissionHandler.js';
import {Message} from '../../dist/core/domain/models/Message.js';

// ========================================
// Test Fixtures
// ========================================

const TEST_PROJECT_ROOT = path.resolve(process.cwd());

// ========================================
// Mock API Client - Simulates AI with Tool Use
// ========================================

/**
 * Mock AI that simulates tool calling for symbol search
 */
class MockAIWithSymbolSearch implements IApiClient {
	private callCount = 0;
	private scenario: string;

	constructor(scenario: 'find-class' | 'find-references' | 'multi-tool') {
		this.scenario = scenario;
	}

	async chat(request: ApiRequest): Promise<ApiResponse> {
		this.callCount++;

		if (this.scenario === 'find-class') {
			return this.handleFindClassScenario(request);
		} else if (this.scenario === 'find-references') {
			return this.handleFindReferencesScenario(request);
		} else if (this.scenario === 'multi-tool') {
			return this.handleMultiToolScenario(request);
		}

		throw new Error(`Unknown scenario: ${this.scenario}`);
	}

	private handleFindClassScenario(request: ApiRequest): ApiResponse {
		// Call 1: AI decides to use symbol_search
		if (this.callCount === 1) {
			return {
				content: 'I will search for the UserService class.',
				model: 'mock-ai',
				finishReason: 'tool_calls',
				toolCalls: [
					{
						id: 'call_1',
						name: 'symbol_search',
						arguments: {
							namePattern: 'UserService',
							substringMatching: false,
						},
					},
				],
			};
		}

		// Call 2: After receiving tool results, AI provides final answer
		return {
			content:
				'I found the UserService class. It contains methods for user management.',
			model: 'mock-ai',
			finishReason: 'stop',
		};
	}

	private handleFindReferencesScenario(request: ApiRequest): ApiResponse {
		// Call 1: AI uses find_references
		if (this.callCount === 1) {
			return {
				content: 'I will find all references to the createUser method.',
				model: 'mock-ai',
				finishReason: 'tool_calls',
				toolCalls: [
					{
						id: 'call_1',
						name: 'find_references',
						arguments: {
							namePath: 'UserService/createUser',
							filePath: 'test/fixtures/sample-code/UserService.ts',
						},
					},
				],
			};
		}

		// Call 2: Final response
		return {
			content: 'I found the references to createUser method.',
			model: 'mock-ai',
			finishReason: 'stop',
		};
	}

	private handleMultiToolScenario(request: ApiRequest): ApiResponse {
		// Call 1: Use get_symbols_overview
		if (this.callCount === 1) {
			return {
				content: 'First, I will get an overview of the file.',
				model: 'mock-ai',
				finishReason: 'tool_calls',
				toolCalls: [
					{
						id: 'call_1',
						name: 'get_symbols_overview',
						arguments: {
							filePath: 'test/fixtures/sample-code/UserService.ts',
						},
					},
				],
			};
		}

		// Call 2: Use symbol_search after overview
		if (this.callCount === 2) {
			return {
				content: 'Now I will search for the UserService class with details.',
				model: 'mock-ai',
				finishReason: 'tool_calls',
				toolCalls: [
					{
						id: 'call_2',
						name: 'symbol_search',
						arguments: {
							namePattern: 'UserService',
							includeBody: true,
							depth: 1,
						},
					},
				],
			};
		}

		// Call 3: Final response after using both tools
		return {
			content:
				'I have analyzed the UserService class. It has several methods for user management.',
			model: 'mock-ai',
			finishReason: 'stop',
		};
	}

	async streamChat(
		request: ApiRequest,
		onChunk: (chunk: StreamChunk) => void,
	): Promise<ApiResponse> {
		const response = await this.chat(request);
		onChunk({content: response.content, done: true});
		return response;
	}

	async healthCheck(): Promise<boolean> {
		return true;
	}

	getProviderName(): string {
		return 'mock-ai';
	}

	async getAvailableModels(): Promise<string[]> {
		return ['mock-ai'];
	}

	getCallCount(): number {
		return this.callCount;
	}
}

// ========================================
// Mock Infrastructure
// ========================================

class MockHistoryRepository implements IHistoryRepository {
	private messages: Message[] = [];

	async addMessage(message: Message): Promise<void> {
		this.messages.push(message);
	}

	async getRecentMessages(limit: number): Promise<Message[]> {
		return this.messages.slice(-limit);
	}

	async clearHistory(): Promise<void> {
		this.messages = [];
	}

	async saveToFile(): Promise<void> {}
	async loadFromFile(): Promise<void> {}
}

class MockPermissionHandler implements IToolPermissionHandler {
	async requestPermission(toolName: string, args: any): Promise<boolean> {
		// Auto-approve symbol tools (safe, read-only)
		if (
			toolName === 'symbol_search' ||
			toolName === 'find_references' ||
			toolName === 'get_symbols_overview'
		) {
			return true;
		}
		return false;
	}
}

// ========================================
// Helper Functions
// ========================================

function createCodehClientForTest(apiClient: IApiClient): {
	client: CodehClient;
	registry: ToolRegistry;
} {
	const historyRepo = new MockHistoryRepository();
	const permissionHandler = new MockPermissionHandler();
	const toolRegistry = new ToolRegistry();

	// Register symbol tools
	toolRegistry.register(new SymbolSearchTool(TEST_PROJECT_ROOT));
	toolRegistry.register(new FindReferencesTool(TEST_PROJECT_ROOT));
	toolRegistry.register(new GetSymbolsOverviewTool(TEST_PROJECT_ROOT));

	const client = new CodehClient(
		apiClient,
		historyRepo,
		toolRegistry,
		permissionHandler,
	);

	return {client, registry};
}

// ========================================
// E2E Tests
// ========================================

test('E2E: AI discovers and uses symbol_search tool', async t => {
	const mockAI = new MockAIWithSymbolSearch('find-class');
	const {client} = createCodehClientForTest(mockAI);

	const turn = await client.execute('Find the UserService class');

	// Verify AI was called multiple times (tool calling loop)
	t.is(
		mockAI.getCallCount(),
		2,
		'AI should be called twice (request + continue)',
	);

	// Verify turn has tool calls
	t.true(turn.hasToolCalls(), 'Turn should have tool calls');
	t.is(turn.toolCalls?.length, 1, 'Should have 1 tool call');
	t.is(
		turn.toolCalls?.[0].name,
		'symbol_search',
		'Tool should be symbol_search',
	);

	// Verify final response
	t.truthy(turn.response, 'Should have response');
	t.true(
		turn.response!.content.includes('UserService'),
		'Response should mention UserService',
	);
});

test('E2E: AI uses find_references tool', async t => {
	const mockAI = new MockAIWithSymbolSearch('find-references');
	const {client} = createCodehClientForTest(mockAI);

	const turn = await client.execute('Find all references to createUser');

	// Verify tool calling
	t.is(mockAI.getCallCount(), 2);
	t.true(turn.hasToolCalls());
	t.is(turn.toolCalls?.[0].name, 'find_references');

	// Verify arguments passed correctly
	const args = turn.toolCalls?.[0].arguments;
	t.is(args?.namePath, 'UserService/createUser');
	t.truthy(args?.filePath);
});

test('E2E: AI uses multiple tools in sequence', async t => {
	const mockAI = new MockAIWithSymbolSearch('multi-tool');
	const {client} = createCodehClientForTest(mockAI);

	const turn = await client.execute('Analyze the UserService class');

	// Verify multiple API calls (1 initial + 2 continuations)
	t.is(mockAI.getCallCount(), 3, 'AI should be called 3 times');

	// Verify final response
	t.truthy(turn.response);
	t.true(
		turn.response!.content.includes('analyzed'),
		'Should indicate analysis complete',
	);
});

test('E2E: Tool definitions are sent to AI', async t => {
	const mockAI = new MockAIWithSymbolSearch('find-class');
	const {client, registry} = createCodehClientForTest(mockAI);

	// Capture the request to verify tools are included
	let capturedRequest: ApiRequest | undefined;
	const originalChat = mockAI.chat.bind(mockAI);
	mockAI.chat = async (request: ApiRequest) => {
		capturedRequest = request;
		return originalChat(request);
	};

	await client.execute('Find UserService');

	// Verify tools were included in request
	t.truthy(capturedRequest);
	t.truthy(capturedRequest!.tools);
	t.true(capturedRequest!.tools!.length >= 3, 'Should have at least 3 tools');

	// Verify tool definitions have correct structure
	const tool = capturedRequest!.tools![0];
	t.truthy(tool.name);
	t.truthy(tool.description);
	t.truthy(tool.parameters);
	t.is(tool.parameters.type, 'object');
});

test('E2E: Tool execution results are sent back to AI', async t => {
	const mockAI = new MockAIWithSymbolSearch('find-class');
	const {client} = createCodehClientForTest(mockAI);

	// Capture second API call (continuation with tool results)
	let secondCallRequest: ApiRequest | undefined;
	const originalChat = mockAI.chat.bind(mockAI);
	let callCount = 0;
	mockAI.chat = async (request: ApiRequest) => {
		callCount++;
		if (callCount === 2) {
			secondCallRequest = request;
		}
		return originalChat(request);
	};

	await client.execute('Find UserService');

	// Verify second call includes tool results in messages
	t.truthy(secondCallRequest);
	t.true(secondCallRequest!.messages.length > 1);

	// Check if tool result is in messages
	const hasToolResult = secondCallRequest!.messages.some(m =>
		m.content.includes('symbol_search'),
	);
	t.true(hasToolResult, 'Should include tool execution result');
});

test('E2E: Permission system works for symbol tools', async t => {
	const mockAI = new MockAIWithSymbolSearch('find-class');
	const {client} = createCodehClientForTest(mockAI);

	// Symbol tools should be auto-approved
	const turn = await client.execute('Find UserService');

	t.true(turn.hasToolCalls());
	// If we get here, permission was approved (no rejection)
	t.pass();
});

test('E2E: Tool metadata is captured in turn', async t => {
	const mockAI = new MockAIWithSymbolSearch('find-class');
	const {client} = createCodehClientForTest(mockAI);

	const turn = await client.execute('Find UserService');

	// Verify metadata
	t.truthy(turn.metadata);
	t.truthy(turn.metadata?.duration);
	t.truthy(turn.response);
});

test('E2E: Streaming with tool calls', async t => {
	const mockAI = new MockAIWithSymbolSearch('find-class');
	const {client} = createCodehClientForTest(mockAI);

	const chunks: string[] = [];
	const turn = await client.executeWithStreaming('Find UserService', chunk => {
		chunks.push(chunk);
	});

	// Verify streaming worked
	t.true(chunks.length > 0, 'Should receive chunks');

	// Verify tool calls still work with streaming
	t.true(turn.hasToolCalls());
	t.is(mockAI.getCallCount(), 2);
});

// ========================================
// Tool Registry Integration Tests
// ========================================

test('ToolRegistry: All symbol tools are registered and executable', async t => {
	const registry = new ToolRegistry();
	registry.register(new SymbolSearchTool(TEST_PROJECT_ROOT));
	registry.register(new FindReferencesTool(TEST_PROJECT_ROOT));
	registry.register(new GetSymbolsOverviewTool(TEST_PROJECT_ROOT));

	// Verify registration
	t.is(registry.getDefinitions().length, 3);

	// Verify all tools are executable
	const symbolSearchExists = registry.hasExecutor('symbol_search');
	const findRefsExists = registry.hasExecutor('find_references');
	const overviewExists = registry.hasExecutor('get_symbols_overview');

	t.true(symbolSearchExists);
	t.true(findRefsExists);
	t.true(overviewExists);
});

test('ToolRegistry: Tool definitions have correct format', async t => {
	const registry = new ToolRegistry();
	registry.register(new SymbolSearchTool(TEST_PROJECT_ROOT));

	const definitions = registry.getDefinitions();
	t.is(definitions.length, 1);

	const def = definitions[0];
	t.is(def.name, 'symbol_search');
	t.truthy(def.description);
	t.truthy(def.inputSchema);
	t.is(def.inputSchema!.type, 'object');
	t.truthy(def.inputSchema!.properties);
	t.true(Array.isArray(def.inputSchema!.required));
});
