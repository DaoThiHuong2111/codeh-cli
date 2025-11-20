/**
 * Tests for GenericSDKAdapter
 * Coverage target: 95%
 */

import test from 'ava';
import OpenAI from 'openai';
import {GenericSDKAdapter} from '../../../dist/infrastructure/api/clients/GenericSDKAdapter.js';
import type {ApiRequest} from '../../../dist/core/domain/interfaces/IApiClient.js';

// ===========================
// Test Setup & Helpers
// ===========================

const TEST_BASE_URL = 'http://localhost:1234/v1';
const TEST_API_KEY = 'test-key';
const TEST_MODEL = 'local-model';

/**
 * Mock OpenAI SDK Client
 */
class MockOpenAIClient {
	chat = {
		completions: {
			async create(params: any): Promise<any> {
				// Handle streaming
				if (params.stream) {
					throw new Error('Use streaming mock for stream=true');
				}

				// Return mock completion
				return {
					id: 'chatcmpl-test-123',
					object: 'chat.completion',
					created: Date.now(),
					model: params.model || TEST_MODEL,
					choices: [
						{
							index: 0,
							message: {
								role: 'assistant',
								content: 'Mock response from Generic Provider',
								tool_calls: undefined,
							},
							finish_reason: 'stop',
						},
					],
					usage: {
						prompt_tokens: 10,
						completion_tokens: 20,
						total_tokens: 30,
					},
				};
			},
		},
	};

	models = {
		async list(): Promise<any> {
			return {
				data: [
					{id: 'local-model', object: 'model'},
					{id: 'another-model', object: 'model'},
				],
			};
		},
	};
}

/**
 * Create a test adapter with mocked SDK
 */
function createTestAdapter(mockOverrides?: any): {
	adapter: GenericSDKAdapter;
	mockClient: MockOpenAIClient;
} {
	const mockClient = new MockOpenAIClient();

	// Apply overrides if provided
	if (mockOverrides) {
		Object.assign(mockClient, mockOverrides);
	}

	const adapter = new GenericSDKAdapter(TEST_BASE_URL, TEST_API_KEY);

	// Inject mock client
	(adapter as any).sdk = mockClient;

	return {adapter, mockClient};
}

// ===========================
// Initialization Tests
// ===========================

test('creates adapter with valid config', (t) => {
	const adapter = new GenericSDKAdapter(TEST_BASE_URL, TEST_API_KEY);
	t.truthy(adapter);
	t.is(adapter.getProviderName(), 'generic');
});

test('creates adapter without API key', (t) => {
	const adapter = new GenericSDKAdapter(TEST_BASE_URL);
	t.truthy(adapter);
	t.is(adapter.getProviderName(), 'generic');
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
	t.is(response.content, 'Mock response from Generic Provider');
	t.is(response.model, TEST_MODEL);
	t.is(response.finishReason, 'stop');
});

test('sends message with system prompt', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	let capturedParams: any;
	mockClient.chat.completions.create = async (params: any) => {
		capturedParams = params;
		return {
			id: 'chatcmpl-test-123',
			object: 'chat.completion',
			created: Date.now(),
			model: TEST_MODEL,
			choices: [
				{
					index: 0,
					message: {role: 'assistant', content: 'Response'},
					finish_reason: 'stop',
				},
			],
		};
	};

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello'}],
		systemPrompt: 'System prompt',
		model: TEST_MODEL,
	};

	await adapter.chat(request);

	t.truthy(capturedParams);
	// System prompt should be converted to system message
	t.truthy(capturedParams.messages.find((m: any) => m.role === 'system'));
	t.is(capturedParams.messages[0].content, 'System prompt');
});

test('handles tool calls in response', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	mockClient.chat.completions.create = async () => {
		return {
			id: 'chatcmpl-test-123',
			object: 'chat.completion',
			created: Date.now(),
			model: TEST_MODEL,
			choices: [
				{
					index: 0,
					message: {
						role: 'assistant',
						content: null,
						tool_calls: [
							{
								id: 'call_123',
								type: 'function',
								function: {
									name: 'get_weather',
									arguments: JSON.stringify({location: 'London'}),
								},
							},
						],
					},
					finish_reason: 'tool_calls',
				},
			],
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
	const {adapter, mockClient} = createTestAdapter();

	mockClient.chat.completions.create = async (params: any) => {
		if (!params.stream) throw new Error('Expected stream=true');
		return (async function* () {
			yield {
				choices: [{delta: {content: 'Mock '}}],
			};
			yield {
				choices: [{delta: {content: 'response'}}],
			};
			yield {
				choices: [{finish_reason: 'stop'}],
			};
		})();
	};

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
	mockClient.chat.completions.create = async () => {
		throw new Error('Connection refused');
	};
	const healthy = await adapter.healthCheck();
	t.false(healthy);
});

test('getAvailableModels returns model names', async (t) => {
	const {adapter} = createTestAdapter();
	const models = await adapter.getAvailableModels();
	t.deepEqual(models, ['local-model', 'another-model']);
});

test('getAvailableModels returns empty array on error', async (t) => {
	const {adapter, mockClient} = createTestAdapter();
	mockClient.models.list = async () => {
		throw new Error('Failed to list models');
	};
	const models = await adapter.getAvailableModels();
	t.deepEqual(models, []);
});

// ===========================
// Error Handling
// ===========================

test('handles API errors', async (t) => {
	const {adapter, mockClient} = createTestAdapter();
	mockClient.chat.completions.create = async () => {
		const error = new Error('401 Unauthorized');
		(error as any).status = 401;
		Object.setPrototypeOf(error, OpenAI.APIError.prototype);
		throw error;
	};

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello'}],
		model: TEST_MODEL,
	};

	const error = await t.throwsAsync(async () => {
		await adapter.chat(request);
	});

	t.truthy(error);
	t.true(error!.message.includes('Generic Provider API Error'));
});

test('handles network errors', async (t) => {
	const {adapter, mockClient} = createTestAdapter();
	mockClient.chat.completions.create = async () => {
		throw new Error('Network error');
	};

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello'}],
		model: TEST_MODEL,
	};

	const error = await t.throwsAsync(async () => {
		await adapter.chat(request);
	});

	t.truthy(error);
	t.true(error!.message.includes('Network error'));
});
