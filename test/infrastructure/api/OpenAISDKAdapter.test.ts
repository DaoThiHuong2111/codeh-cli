/**
 * Tests for OpenAISDKAdapter
 * Coverage target: 95%
 */

import test from 'ava';
import OpenAI from 'openai';
import {OpenAISDKAdapter} from '../../../dist/infrastructure/api/clients/OpenAISDKAdapter.js';
import type {ApiRequest} from '../../../dist/core/domain/interfaces/IApiClient.js';

// ===========================
// Test Setup & Helpers
// ===========================

const TEST_API_KEY = 'sk-test-key-123456789';
const TEST_BASE_URL = 'https://api.openai.com/v1';
const TEST_MODEL = 'gpt-4';

/**
 * Mock OpenAI SDK Client
 * Simulates OpenAI API responses
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
								content: 'Mock response from OpenAI',
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
					{id: 'gpt-4', object: 'model'},
					{id: 'gpt-3.5-turbo', object: 'model'},
				],
			};
		},
	};
}

/**
 * Create a test adapter with mocked SDK
 */
function createTestAdapter(mockOverrides?: any): {
	adapter: OpenAISDKAdapter;
	mockClient: MockOpenAIClient;
} {
	const mockClient = new MockOpenAIClient();

	// Apply overrides if provided
	if (mockOverrides) {
		Object.assign(mockClient, mockOverrides);
	}

	const adapter = new OpenAISDKAdapter(TEST_API_KEY, TEST_BASE_URL);

	// Inject mock client
	(adapter as any).sdk = mockClient;

	return {adapter, mockClient};
}

// ===========================
// Initialization Tests
// ===========================

test('creates adapter with valid config', (t) => {
	const adapter = new OpenAISDKAdapter(TEST_API_KEY, TEST_BASE_URL);

	t.truthy(adapter);
	t.is(adapter.getProviderName(), 'openai');
});

test('creates adapter with default base URL', (t) => {
	const adapter = new OpenAISDKAdapter(TEST_API_KEY);

	t.truthy(adapter);
	t.is(adapter.getProviderName(), 'openai');
});

test('getProviderName returns openai', (t) => {
	const {adapter} = createTestAdapter();

	const providerName = adapter.getProviderName();

	t.is(providerName, 'openai');
});

// ===========================
// Chat Completion Tests
// ===========================

test('sends simple chat completion and gets response', async (t) => {
	const {adapter} = createTestAdapter();

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello, GPT!'}],
		model: TEST_MODEL,
		maxTokens: 1024,
	};

	const response = await adapter.chat(request);

	t.truthy(response);
	t.is(response.content, 'Mock response from OpenAI');
	t.is(response.model, TEST_MODEL);
	t.is(response.finishReason, 'stop');
	t.is(response.usage?.promptTokens, 10);
	t.is(response.usage?.completionTokens, 20);
	t.is(response.usage?.totalTokens, 30);
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
					message: {
						role: 'assistant',
						content: 'Response with system prompt',
					},
					finish_reason: 'stop',
				},
			],
			usage: {prompt_tokens: 15, completion_tokens: 25, total_tokens: 40},
		};
	};

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello'}],
		systemPrompt: 'You are a helpful assistant.',
		model: TEST_MODEL,
		maxTokens: 1024,
	};

	const response = await adapter.chat(request);

	t.truthy(capturedParams);
	// System prompt is converted to system message in messages array
	t.truthy(capturedParams.messages.find((m: any) => m.role === 'system'));
	t.is(response.content, 'Response with system prompt');
});

test('handles multi-turn conversation', async (t) => {
	const {adapter} = createTestAdapter();

	const request: ApiRequest = {
		messages: [
			{role: 'user', content: 'Hi'},
			{role: 'assistant', content: 'Hello!'},
			{role: 'user', content: 'How are you?'},
		],
		model: TEST_MODEL,
		maxTokens: 1024,
	};

	const response = await adapter.chat(request);

	t.truthy(response);
	t.is(response.content, 'Mock response from OpenAI');
});

test('handles function calling', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	mockClient.chat.completions.create = async (params: any) => {
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
								type: 'function' as const,
								function: {
									name: 'get_weather',
									arguments: JSON.stringify({location: 'San Francisco'}),
								},
							},
						],
					},
					finish_reason: 'tool_calls',
				},
			],
			usage: {prompt_tokens: 20, completion_tokens: 15, total_tokens: 35},
		};
	};

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'What is the weather in San Francisco?'}],
		tools: [
			{
				name: 'get_weather',
				description: 'Get weather for a location',
				parameters: {
					type: 'object',
					properties: {
						location: {type: 'string', description: 'Location name'},
					},
					required: ['location'],
				},
			},
		],
		model: TEST_MODEL,
		maxTokens: 1024,
	};

	const response = await adapter.chat(request);

	t.truthy(response);
	t.is(response.finishReason, 'tool_calls');
	t.truthy(response.toolCalls);
	t.is(response.toolCalls!.length, 1);
	t.is(response.toolCalls![0].name, 'get_weather');
	t.deepEqual(response.toolCalls![0].arguments, {location: 'San Francisco'});
});

test('handles max tokens parameter', async (t) => {
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
					finish_reason: 'length',
				},
			],
			usage: {prompt_tokens: 10, completion_tokens: 2048, total_tokens: 2058},
		};
	};

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello'}],
		model: TEST_MODEL,
		maxTokens: 2048,
	};

	const response = await adapter.chat(request);

	t.is(capturedParams.max_tokens, 2048);
	t.is(response.finishReason, 'length');
});

test('handles temperature parameter', async (t) => {
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
			usage: {prompt_tokens: 10, completion_tokens: 20, total_tokens: 30},
		};
	};

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello'}],
		model: TEST_MODEL,
		maxTokens: 1024,
		temperature: 0.5,
	};

	await adapter.chat(request);

	t.is(capturedParams.temperature, 0.5);
});

test('handles empty response content', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	mockClient.chat.completions.create = async (params: any) => {
		return {
			id: 'chatcmpl-test-123',
			object: 'chat.completion',
			created: Date.now(),
			model: TEST_MODEL,
			choices: [
				{
					index: 0,
					message: {role: 'assistant', content: ''},
					finish_reason: 'stop',
				},
			],
			usage: {prompt_tokens: 10, completion_tokens: 0, total_tokens: 10},
		};
	};

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello'}],
		model: TEST_MODEL,
		maxTokens: 1024,
	};

	const response = await adapter.chat(request);

	t.is(response.content, '');
	t.is(response.usage?.completionTokens, 0);
});

// ===========================
// Error Handling Tests
// ===========================

test('handles API error 401 - authentication error', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	mockClient.chat.completions.create = async () => {
		// OpenAI.APIError simply needs message and status
		const error = new Error('401 Invalid API key');
		(error as any).status = 401;
		Object.setPrototypeOf(error, OpenAI.APIError.prototype);
		throw error;
	};

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello'}],
		model: TEST_MODEL,
		maxTokens: 1024,
	};

	const error = await t.throwsAsync(async () => {
		await adapter.chat(request);
	});

	t.truthy(error);
	t.true(error!.message.includes('401') || error!.message.includes('OpenAI'));
});

test('handles API error 429 - rate limiting', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	mockClient.chat.completions.create = async () => {
		const error = new Error('429 Rate limit exceeded');
		(error as any).status = 429;
		Object.setPrototypeOf(error, OpenAI.APIError.prototype);
		throw error;
	};

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello'}],
		model: TEST_MODEL,
		maxTokens: 1024,
	};

	const error = await t.throwsAsync(async () => {
		await adapter.chat(request);
	});

	t.truthy(error);
	t.true(error!.message.includes('429') || error!.message.includes('OpenAI'));
});

test('handles API error 500 - server error', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	mockClient.chat.completions.create = async () => {
		const error = new Error('500 Internal server error');
		(error as any).status = 500;
		Object.setPrototypeOf(error, OpenAI.APIError.prototype);
		throw error;
	};

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello'}],
		model: TEST_MODEL,
		maxTokens: 1024,
	};

	const error = await t.throwsAsync(async () => {
		await adapter.chat(request);
	});

	t.truthy(error);
	t.true(error!.message.includes('500') || error!.message.includes('OpenAI'));
});

test('handles network errors', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	mockClient.chat.completions.create = async () => {
		throw new Error('Network connection failed');
	};

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello'}],
		model: TEST_MODEL,
		maxTokens: 1024,
	};

	const error = await t.throwsAsync(async () => {
		await adapter.chat(request);
	});

	t.truthy(error);
	t.true(error!.message.includes('Network connection failed'));
});

// ===========================
// Health Check Tests
// ===========================

test('healthCheck returns true on success', async (t) => {
	const {adapter} = createTestAdapter();

	const isHealthy = await adapter.healthCheck();

	t.true(isHealthy);
});

test('healthCheck returns false on failure', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	mockClient.chat.completions.create = async () => {
		throw new Error('API unavailable');
	};

	const isHealthy = await adapter.healthCheck();

	t.false(isHealthy);
});

// ===========================
// getAvailableModels Tests
// ===========================

test('getAvailableModels returns list of models', async (t) => {
	const {adapter} = createTestAdapter();

	const models = await adapter.getAvailableModels();

	t.true(Array.isArray(models));
	t.true(models.length > 0);
	t.true(models.includes('gpt-4'));
	t.true(models.includes('gpt-3.5-turbo'));
});

test('getAvailableModels handles API error gracefully', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	mockClient.models.list = async () => {
		throw new Error('Failed to fetch models');
	};

	const models = await adapter.getAvailableModels();

	// Should return empty array on error
	t.true(Array.isArray(models));
	t.is(models.length, 0);
});
