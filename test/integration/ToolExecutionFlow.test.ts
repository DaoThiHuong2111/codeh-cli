/**
 * Integration Test: Tool Execution Flow
 * Tests complete tool execution pipeline with mock API responses
 */

import test from 'ava';
import {CodehClient} from '../../dist/core/application/CodehClient.js';
import {Turn} from '../../dist/core/domain/models/Turn.js';
import {Message} from '../../dist/core/domain/models/Message.js';
import {Configuration} from '../../dist/core/domain/models/Configuration.js';
import type {
	IApiClient,
	ApiRequest,
	ApiResponse,
	StreamChunk,
} from '../../dist/core/domain/interfaces/IApiClient.js';
import type {IHistoryRepository} from '../../dist/core/domain/interfaces/IHistoryRepository.js';
import type {IToolPermissionHandler} from '../../dist/core/domain/interfaces/IToolPermissionHandler.js';
import {ToolRegistry} from '../../dist/core/tools/base/ToolRegistry.js';
import {Tool} from '../../dist/core/tools/base/Tool.js';
import type {
	ToolDefinition,
	ToolExecutionResult,
} from '../../dist/core/domain/interfaces/IToolExecutor.js';

// ========================================
// Mock API Client with Tool Use Response
// ========================================

class MockApiClientWithToolUse implements IApiClient {
	private callCount = 0;

	async chat(request: ApiRequest): Promise<ApiResponse> {
		this.callCount++;

		// First call: LLM requests tool
		if (this.callCount === 1) {
			return {
				content: "I'll list the files for you using the shell command.",
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
						name: 'shell',
						arguments: {
							command: 'ls -la',
						},
					},
				],
			};
		}

		// Second call: After tool execution, LLM provides final response
		return {
			content:
				'Here are the files in your directory:\n- file1.txt\n- file2.txt\n- folder/',
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
		this.callCount++;

		// Simulate streaming
		if (this.callCount === 1) {
			// First response with tool use
			const content = "I'll list the files for you.";
			const words = content.split(' ');
			for (const word of words) {
				onChunk({content: word + ' ', done: false});
			}

			onChunk({done: true});

			return {
				content,
				model: 'mock-model',
				usage: {
					promptTokens: 20,
					completionTokens: 10,
					totalTokens: 30,
				},
				finishReason: 'tool_calls',
				toolCalls: [
					{
						id: 'call_1',
						name: 'shell',
						arguments: {
							command: 'ls',
						},
					},
				],
			};
		}

		// Second response after tool execution
		const content = 'Here are the files: file1.txt, file2.txt';
		const words = content.split(' ');
		for (const word of words) {
			onChunk({content: word + ' ', done: false});
		}
		onChunk({done: true});

		return {
			content,
			model: 'mock-model',
			usage: {
				promptTokens: 40,
				completionTokens: 15,
				totalTokens: 55,
			},
			finishReason: 'stop',
		};
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
	}
}

// ========================================
// Mock History Repository
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

	async getHistory(): Promise<Message[]> {
		return [...this.messages];
	}
}

// ========================================
// Mock Permission Handler (Auto-Approve)
// ========================================

class MockPermissionHandler implements IToolPermissionHandler {
	public permissionRequests: any[] = [];

	async requestPermission(context: any): Promise<any> {
		this.permissionRequests.push(context);
		return {
			approved: true,
			reason: 'Auto-approved for testing',
		};
	}

	hasPreApproval(toolName: string): boolean {
		return false;
	}

	async savePermissionPreference(
		toolName: string,
		alwaysAllow: boolean,
	): Promise<void> {}

	async clearPreferences(): Promise<void> {}

	resetRequests() {
		this.permissionRequests = [];
	}
}

// ========================================
// Mock Shell Tool
// ========================================

class MockShellTool extends Tool {
	constructor() {
		super();
	}

	getDefinition(): ToolDefinition {
		return {
			name: 'shell',
			description: 'Execute shell commands',
			parameters: [
				{
					name: 'command',
					type: 'string',
					description: 'The shell command to execute',
					required: true,
				},
			],
		};
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		const {command} = parameters;

		// Mock execution
		if (command === 'ls' || command === 'ls -la') {
			return {
				success: true,
				output: 'file1.txt\nfile2.txt\nfolder/',
				metadata: {
					executedAt: new Date().toISOString(),
					duration: 45,
				},
			};
		}

		return {
			success: false,
			output: '',
			error: `Unknown command: ${command}`,
		};
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return (
			typeof parameters.command === 'string' && parameters.command.length > 0
		);
	}

	getName(): string {
		return 'shell';
	}

	getDescription(): string {
		return 'Execute shell commands';
	}
}

// ========================================
// Test Setup Helper
// ========================================

function createTestClient() {
	const apiClient = new MockApiClientWithToolUse();
	const historyRepo = new MockHistoryRepository();
	const permissionHandler = new MockPermissionHandler();
	const toolRegistry = new ToolRegistry();

	// Register mock shell tool
	toolRegistry.register(new MockShellTool());

	// Create mock configuration
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
		permissionHandler,
		toolRegistry,
	};
}

// ========================================
// Tests
// ========================================

test('Tool execution flow: non-streaming mode', async t => {
	const {client, apiClient, permissionHandler} = createTestClient();

	// Execute chat that triggers tool use
	const turn = await client.execute('list files');

	// Verify turn structure
	t.truthy(turn, 'Turn should exist');
	t.truthy(turn.request, 'Turn should have request');
	t.truthy(turn.response, 'Turn should have response');

	// Verify permission was requested
	t.is(
		permissionHandler.permissionRequests.length,
		1,
		'Should request permission once',
	);
	t.is(
		permissionHandler.permissionRequests[0].toolCall.name,
		'shell',
		'Should request permission for shell tool',
	);

	// Verify API was called twice (initial + continuation)
	// Note: callCount is internal, we verify by checking final response
	t.truthy(turn.response?.content, 'Should have final response content');
	t.true(
		turn.response!.content.includes('files'),
		'Response should mention files',
	);

	// Verify no tool calls in final response (orchestration completed)
	t.falsy(
		turn.response?.toolCalls,
		'Final response should not have tool calls',
	);

	console.log('\n✅ Non-streaming test passed');
	console.log('Final response:', turn.response?.content);
});

test('Tool execution flow: streaming mode', async t => {
	const {client, apiClient, permissionHandler} = createTestClient();

	let streamedContent = '';
	const chunks: string[] = [];

	// Execute streaming chat
	const turn = await client.executeWithStreaming('list files', chunk => {
		streamedContent += chunk;
		chunks.push(chunk);
	});

	// Verify streaming occurred
	t.true(chunks.length > 0, 'Should receive stream chunks');
	t.true(streamedContent.length > 0, 'Should have streamed content');

	// Verify permission was requested
	t.is(
		permissionHandler.permissionRequests.length,
		1,
		'Should request permission once',
	);

	// Verify final turn
	t.truthy(turn, 'Turn should exist');
	t.truthy(turn.response, 'Turn should have response');
	t.truthy(turn.response?.content, 'Should have final response content');

	// Verify orchestration completed
	t.falsy(
		turn.response?.toolCalls,
		'Final response should not have tool calls after orchestration',
	);

	console.log('\n✅ Streaming test passed');
	console.log('Streamed chunks:', chunks.length);
	console.log('Final response:', turn.response?.content);
});

test('Tool execution: permission check is called', async t => {
	const {client, permissionHandler} = createTestClient();

	await client.execute('list files');

	// Verify permission handler was called
	t.is(permissionHandler.permissionRequests.length, 1);

	const permissionContext = permissionHandler.permissionRequests[0];
	t.is(permissionContext.toolCall.name, 'shell');
	t.deepEqual(permissionContext.toolCall.arguments, {command: 'ls -la'});
	t.truthy(permissionContext.timestamp);

	console.log('\n✅ Permission check test passed');
});

test('Tool execution: multiple calls in agentic loop', async t => {
	// Create client with API that does 2 tool calls
	const apiClient = new MockApiClientWithToolUse();
	const historyRepo = new MockHistoryRepository();
	const permissionHandler = new MockPermissionHandler();
	const toolRegistry = new ToolRegistry();
	toolRegistry.register(new MockShellTool());

	// Override chat to simulate 2 tool use iterations
	let callCount = 0;
	apiClient.chat = async (request: ApiRequest): Promise<ApiResponse> => {
		callCount++;

		if (callCount === 1) {
			// First call: request first tool
			return {
				content: 'First tool call',
				model: 'mock',
				usage: {promptTokens: 10, completionTokens: 5, totalTokens: 15},
				finishReason: 'tool_calls',
				toolCalls: [
					{
						id: 'call_1',
						name: 'shell',
						arguments: {command: 'ls'},
					},
				],
			};
		} else if (callCount === 2) {
			// Second call after first tool: request second tool
			return {
				content: 'Second tool call',
				model: 'mock',
				usage: {promptTokens: 20, completionTokens: 10, totalTokens: 30},
				finishReason: 'tool_calls',
				toolCalls: [
					{
						id: 'call_2',
						name: 'shell',
						arguments: {command: 'ls -la'},
					},
				],
			};
		}

		// Third call: final response
		return {
			content: 'All done!',
			model: 'mock',
			usage: {promptTokens: 30, completionTokens: 5, totalTokens: 35},
			finishReason: 'stop',
		};
	};

	// Create mock configuration
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

	const turn = await client.execute('test');

	// Should have executed 2 tools
	t.is(permissionHandler.permissionRequests.length, 2);
	t.is(
		permissionHandler.permissionRequests[0].toolCall.arguments.command,
		'ls',
	);
	t.is(
		permissionHandler.permissionRequests[1].toolCall.arguments.command,
		'ls -la',
	);

	// Final response should be text only
	t.is(turn.response?.content, 'All done!');
	t.falsy(turn.response?.toolCalls);

	console.log('\n✅ Agentic loop test passed');
	console.log(
		'Tool calls executed:',
		permissionHandler.permissionRequests.length,
	);
});

test('Tool execution: max iterations limit', async t => {
	const apiClient = new MockApiClientWithToolUse();
	const historyRepo = new MockHistoryRepository();
	const permissionHandler = new MockPermissionHandler();
	const toolRegistry = new ToolRegistry();
	toolRegistry.register(new MockShellTool());

	// Override to always request tools (infinite loop scenario)
	let callCount = 0;
	apiClient.chat = async (request: ApiRequest): Promise<ApiResponse> => {
		callCount++;

		// Always request a tool (would loop forever without max iterations)
		return {
			content: `Tool call ${callCount}`,
			model: 'mock',
			usage: {promptTokens: 10, completionTokens: 5, totalTokens: 15},
			finishReason: 'tool_calls',
			toolCalls: [
				{
					id: `call_${callCount}`,
					name: 'shell',
					arguments: {command: 'ls'},
				},
			],
		};
	};

	// Create mock configuration
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

	const turn = await client.execute('test');

	// Should stop at max iterations (5)
	t.true(
		permissionHandler.permissionRequests.length <= 5,
		'Should not exceed max iterations',
	);
	t.is(
		permissionHandler.permissionRequests.length,
		5,
		'Should execute exactly 5 iterations',
	);

	console.log('\n✅ Max iterations test passed');
	console.log(
		'Stopped at:',
		permissionHandler.permissionRequests.length,
		'iterations',
	);
});

test('Tool definitions are sent to API', async t => {
	const {client} = createTestClient();

	// Create custom API client that captures request
	let capturedRequest: ApiRequest | null = null;
	const capturingClient = new MockApiClientWithToolUse();
	const originalChat = capturingClient.chat.bind(capturingClient);

	capturingClient.chat = async (request: ApiRequest): Promise<ApiResponse> => {
		capturedRequest = request;
		return originalChat(request);
	};

	// Replace client's API client
	(client as any).apiClient = capturingClient;

	await client.execute('test');

	// Verify tools were sent
	t.truthy(capturedRequest, 'Should capture request');
	t.truthy(capturedRequest!.tools, 'Request should have tools');
	t.true(capturedRequest!.tools!.length > 0, 'Should have at least one tool');

	const shellTool = capturedRequest!.tools!.find(t => t.name === 'shell');
	t.truthy(shellTool, 'Should include shell tool');
	t.is(shellTool!.description, 'Execute shell commands');
	t.truthy(shellTool!.parameters, 'Tool should have parameters');

	console.log('\n✅ Tool definitions test passed');
	console.log(
		'Tools sent:',
		capturedRequest!.tools!.map(t => t.name).join(', '),
	);
});

console.log('\n🧪 Running Tool Execution Integration Tests...\n');
