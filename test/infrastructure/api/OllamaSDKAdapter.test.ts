/**
 * Tests for OllamaSDKAdapter
 * Coverage target: 95%
 */

import test from 'ava';
import {OllamaSDKAdapter} from '../../../dist/infrastructure/api/clients/OllamaSDKAdapter.js';
import type {ApiRequest} from '../../../dist/core/domain/interfaces/IApiClient.js';

// ===========================
// Test Setup & Helpers
// ===========================

const TEST_BASE_URL = 'http://localhost:11434';
const TEST_MODEL = 'llama2';

/**
 * Mock Ollama SDK Client
 */
class MockOllamaClient {
	async chat(params: any): Promise<any> {
		// Handle streaming
		if (params.stream) {
			return (async function* () {
				yield {
					message: {content: 'Mock '},
					done: false,
				};
				yield {
					message: {content: 'response'},
					done: false,
				};
				yield {
					message: {content: ''},
					done: true,
					total_duration: 1000,
					prompt_eval_count: 5,
					eval_count: 10,
				};
			})();
		}

		// Handle non-streaming
		return {
			model: params.model || TEST_MODEL,
			created_at: new Date().toISOString(),
			message: {
				role: 'assistant',
				content: 'Mock response from Ollama',
			},
			done: true,
			total_duration: 1000,
			prompt_eval_count: 10,
			eval_count: 20,
		};
	}

	async list(): Promise<any> {
		return {
			models: [
				{name: 'llama2', modified_at: new Date().toISOString(), size: 1000},
				{name: 'mistral', modified_at: new Date().toISOString(), size: 1000},
			],
		};
	}
}

/**
 * Create a test adapter with mocked SDK
 */
function createTestAdapter(mockOverrides?: any): {
	adapter: OllamaSDKAdapter;
	mockClient: MockOllamaClient;
} {
	const mockClient = new MockOllamaClient();

	// Apply overrides if provided
	if (mockOverrides) {
		Object.assign(mockClient, mockOverrides);
	}

	const adapter = new OllamaSDKAdapter(TEST_BASE_URL);

	// Inject mock client
	(adapter as any).sdk = mockClient;

	return {adapter, mockClient};
}

// ===========================
// Initialization Tests
// ===========================

test('creates adapter with valid config', (t) => {
	const adapter = new OllamaSDKAdapter(TEST_BASE_URL);
	t.truthy(adapter);
	t.is(adapter.getProviderName(), 'ollama');
});

test('creates adapter with default base URL', (t) => {
	const adapter = new OllamaSDKAdapter();
	t.truthy(adapter);
	t.is(adapter.getProviderName(), 'ollama');
});

// ===========================
// Chat Tests
// ===========================

test('sends simple chat request and gets response', async (t) => {
	const {adapter} = createTestAdapter();

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello'}],
		model: TEST_MODEL,
		maxTokens: 100,
	};

	const response = await adapter.chat(request);

	t.truthy(response);
	t.is(response.content, 'Mock response from Ollama');
	t.is(response.model, TEST_MODEL);
	t.is(response.finishReason, 'stop');
	t.is(response.usage.promptTokens, 10);
	t.is(response.usage.completionTokens, 20);
});

test('sends message with system prompt', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	let capturedParams: any;
	mockClient.chat = async (params: any) => {
		capturedParams = params;
		return {
			model: TEST_MODEL,
			message: {role: 'assistant', content: 'Response'},
			done: true,
		};
	};

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello'}],
		systemPrompt: 'System prompt',
		model: TEST_MODEL,
	};

	await adapter.chat(request);

	t.truthy(capturedParams);
	// System prompt should be the first message
	t.is(capturedParams.messages[0].role, 'system');
	t.is(capturedParams.messages[0].content, 'System prompt');
});

test('handles tool calls in response', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	mockClient.chat = async () => {
		return {
			model: TEST_MODEL,
			message: {
				role: 'assistant',
				content: '',
				tool_calls: [
					{
						function: {
							name: 'get_weather',
							arguments: {location: 'London'},
						},
					},
				],
			},
			done: true,
		};
	};

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Weather in London?'}],
		model: TEST_MODEL,
	};

	const response = await adapter.chat(request);

	t.truthy(response.toolCalls);
	t.is(response.toolCalls!.length, 1);
	t.is(response.toolCalls![0].name, 'get_weather');
	t.deepEqual(response.toolCalls![0].arguments, {location: 'London'});
});

// ===========================
// Streaming Tests
// ===========================

test('streams response chunks correctly', async (t) => {
	const {adapter} = createTestAdapter();

	const chunks: string[] = [];
	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello'}],
		model: TEST_MODEL,
	};

	const response = await adapter.streamChat(request, (chunk) => {
		if (chunk.content) {
			chunks.push(chunk.content);
		}
	});

	t.is(chunks.join(''), 'Mock response');
	t.is(response.content, 'Mock response');
	t.is(response.usage.completionTokens, 10);
});

test('handles streaming tool calls', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	mockClient.chat = async (params: any) => {
		if (!params.stream) throw new Error('Expected stream=true');
		return (async function* () {
			yield {
				message: {
					role: 'assistant',
					content: '',
					tool_calls: [
						{
							function: {
								name: 'search',
								arguments: {query: 'ollama'},
							},
						},
					],
				},
				done: false,
			};
			yield {
				done: true,
				prompt_eval_count: 5,
				eval_count: 0,
			};
		})();
	};

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Search for ollama'}],
		model: TEST_MODEL,
	};

	const response = await adapter.streamChat(request, () => {});

	t.truthy(response.toolCalls);
	t.is(response.toolCalls!.length, 1);
	t.is(response.toolCalls![0].name, 'search');
	t.deepEqual(response.toolCalls![0].arguments, {query: 'ollama'});
});

// ===========================
// Health Check & Models
// ===========================

test('healthCheck returns true when connected', async (t) => {
	const {adapter} = createTestAdapter();
	const healthy = await adapter.healthCheck();
	t.true(healthy);
});

test('healthCheck returns false when disconnected', async (t) => {
	const {adapter, mockClient} = createTestAdapter();
	mockClient.list = async () => {
		throw new Error('Connection refused');
	};
	const healthy = await adapter.healthCheck();
	t.false(healthy);
});

test('getAvailableModels returns model names', async (t) => {
	const {adapter} = createTestAdapter();
	const models = await adapter.getAvailableModels();
	t.deepEqual(models, ['llama2', 'mistral']);
});

test('getAvailableModels returns empty array on error', async (t) => {
	const {adapter, mockClient} = createTestAdapter();
	mockClient.list = async () => {
		throw new Error('Failed to list models');
	};
	const models = await adapter.getAvailableModels();
	t.deepEqual(models, []);
});

// ===========================
// Error Handling
// ===========================

test('handles chat errors', async (t) => {
	const {adapter, mockClient} = createTestAdapter();
	mockClient.chat = async () => {
		throw new Error('Ollama error');
	};

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello'}],
		model: TEST_MODEL,
	};

	const error = await t.throwsAsync(async () => {
		await adapter.chat(request);
	});

	t.truthy(error);
	t.true(error!.message.includes('Ollama Error'));
});

test('handles streaming errors', async (t) => {
	const {adapter, mockClient} = createTestAdapter();
	mockClient.chat = async () => {
		throw new Error('Stream error');
	};

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello'}],
		model: TEST_MODEL,
	};

	const error = await t.throwsAsync(async () => {
		await adapter.streamChat(request, () => {});
	});

	t.truthy(error);
	t.true(error!.message.includes('Ollama Error'));
});
