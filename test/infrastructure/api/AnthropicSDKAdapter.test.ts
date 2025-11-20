/**
 * Tests for AnthropicSDKAdapter
 * Coverage target: 95%
 */

import test from 'ava';
import Anthropic from '@anthropic-ai/sdk';
import {AnthropicSDKAdapter} from '../../../dist/infrastructure/api/clients/AnthropicSDKAdapter.js';
import type {ApiRequest, ToolCall} from '../../../dist/core/domain/interfaces/IApiClient.js';

// ===========================
// Test Setup & Helpers
// ===========================

const TEST_API_KEY = 'sk-ant-test-key-123456789';
const TEST_BASE_URL = 'https://api.anthropic.com';
const TEST_MODEL = 'claude-3-5-sonnet-20241022';

/**
 * Mock Anthropic SDK Client
 * Simulates anthropic API responses
 */
class MockAnthropicClient {
	messages = {
		async create(params: any): Promise<any> {
			// Simulate successful response
			if (params.stream) {
				throw new Error('Use messages.stream for streaming');
			}

			return {
				id: 'msg_test_123',
				type: 'message',
				role: 'assistant',
				content: [
					{
						type: 'text',
						text: 'Mock response from Anthropic',
					},
				],
				model: params.model || TEST_MODEL,
				stop_reason: 'end_turn',
				usage: {
					input_tokens: 10,
					output_tokens: 20,
				},
			};
		},
	};
}

/**
 * Create a test adapter with mocked SDK
 */
function createTestAdapter(mockOverrides?: Partial<MockAnthropicClient>): {
	adapter: AnthropicSDKAdapter;
	mockClient: MockAnthropicClient;
} {
	const mockClient = new MockAnthropicClient();

	// Apply overrides if provided
	if (mockOverrides) {
		Object.assign(mockClient, mockOverrides);
	}

	const adapter = new AnthropicSDKAdapter(TEST_API_KEY, TEST_BASE_URL);

	// Inject mock client
	(adapter as any).sdk = mockClient;

	return {adapter, mockClient};
}

// ===========================
// Initialization Tests
// ===========================

test('creates adapter with valid config', (t) => {
	const adapter = new AnthropicSDKAdapter(TEST_API_KEY, TEST_BASE_URL);

	t.truthy(adapter);
	t.is(adapter.getProviderName(), 'anthropic');
});

test('creates adapter with default base URL', (t) => {
	const adapter = new AnthropicSDKAdapter(TEST_API_KEY);

	t.truthy(adapter);
	t.is(adapter.getProviderName(), 'anthropic');
});

test('getProviderName returns anthropic', (t) => {
	const {adapter} = createTestAdapter();

	const providerName = adapter.getProviderName();

	t.is(providerName, 'anthropic');
});

// ===========================
// Non-Streaming Chat Tests
// ===========================

test('sends simple message and gets response', async (t) => {
	const {adapter} = createTestAdapter();

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello, Claude!'}],
		model: TEST_MODEL,
		maxTokens: 1024,
	};

	const response = await adapter.chat(request);

	t.truthy(response);
	t.is(response.content, 'Mock response from Anthropic');
	t.is(response.model, TEST_MODEL);
	t.is(response.finishReason, 'stop');
	t.is(response.usage.promptTokens, 10);
	t.is(response.usage.completionTokens, 20);
	t.is(response.usage.totalTokens, 30);
});

test('sends message with system prompt', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	let capturedParams: any;
	mockClient.messages.create = async (params: any) => {
		capturedParams = params;
		return {
			id: 'msg_test_123',
			type: 'message',
			role: 'assistant',
			content: [{type: 'text', text: 'Response with system prompt'}],
			model: TEST_MODEL,
			stop_reason: 'end_turn',
			usage: {input_tokens: 15, output_tokens: 25},
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
	t.is(capturedParams.system, 'You are a helpful assistant.');
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
	t.is(response.content, 'Mock response from Anthropic');
});

test('handles messages with tool calls', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	mockClient.messages.create = async (params: any) => {
		return {
			id: 'msg_test_123',
			type: 'message',
			role: 'assistant',
			content: [
				{
					type: 'text',
					text: 'Let me execute that tool.',
				},
				{
					type: 'tool_use',
					id: 'tool_call_123',
					name: 'get_weather',
					input: {location: 'San Francisco'},
				},
			],
			model: TEST_MODEL,
			stop_reason: 'tool_use',
			usage: {input_tokens: 20, output_tokens: 15},
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
	t.is(response.content, 'Let me execute that tool.');
	t.is(response.finishReason, 'tool_calls');
	t.truthy(response.toolCalls);
	t.is(response.toolCalls!.length, 1);
	t.is(response.toolCalls![0].name, 'get_weather');
	t.deepEqual(response.toolCalls![0].arguments, {location: 'San Francisco'});
});

test('handles max tokens parameter', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	let capturedParams: any;
	mockClient.messages.create = async (params: any) => {
		capturedParams = params;
		return {
			id: 'msg_test_123',
			type: 'message',
			role: 'assistant',
			content: [{type: 'text', text: 'Response'}],
			model: TEST_MODEL,
			stop_reason: 'max_tokens',
			usage: {input_tokens: 10, output_tokens: 2048},
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
	mockClient.messages.create = async (params: any) => {
		capturedParams = params;
		return {
			id: 'msg_test_123',
			type: 'message',
			role: 'assistant',
			content: [{type: 'text', text: 'Response'}],
			model: TEST_MODEL,
			stop_reason: 'end_turn',
			usage: {input_tokens: 10, output_tokens: 20},
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

	mockClient.messages.create = async (params: any) => {
		return {
			id: 'msg_test_123',
			type: 'message',
			role: 'assistant',
			content: [],
			model: TEST_MODEL,
			stop_reason: 'end_turn',
			usage: {input_tokens: 10, output_tokens: 0},
		};
	};

	const request: ApiRequest = {
		messages: [{role: 'user', content: 'Hello'}],
		model: TEST_MODEL,
		maxTokens: 1024,
	};

	const response = await adapter.chat(request);

	t.is(response.content, '');
	t.is(response.usage.completionTokens, 0);
});

// ===========================
// Error Handling Tests
// ===========================

test('handles API error 401 - authentication error', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	mockClient.messages.create = async () => {
		// Create proper Headers object
		const headers = new Headers();
		headers.set('request-id', 'req_test_123');
		
		const error = new Anthropic.APIError(
			401,
			{
				error: {
					type: 'authentication_error',
					message: 'Invalid API key',
				},
			},
			'Unauthorized',
			headers,
		);
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
	// Error message includes status and message from Anthropic
	t.true(error!.message.includes('Anthropic API Error'));
});

test('handles API error 429 - rate limiting', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	mockClient.messages.create = async () => {
		const headers = new Headers();
		headers.set('request-id', 'req_test_456');
		
		const error = new Anthropic.APIError(
			429,
			{
				error: {
					type: 'rate_limit_error',
					message: 'Rate limit exceeded',
				},
			},
			'Too Many Requests',
			headers,
		);
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
	t.true(error!.message.includes('Anthropic API Error'));
});

test('handles API error 500 - server error', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	mockClient.messages.create = async () => {
		const headers = new Headers();
		headers.set('request-id', 'req_test_789');
		
		const error = new Anthropic.APIError(
			500,
			{
				error: {
					type: 'internal_server_error',
					message: 'Internal server error',
				},
			},
			'Internal Server Error',
			headers,
		);
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
	t.true(error!.message.includes('Anthropic API Error'));
});

test('handles network errors', async (t) => {
	const {adapter, mockClient} = createTestAdapter();

	mockClient.messages.create = async () => {
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

	mockClient.messages.create = async () => {
		throw new Error('API unavailable');
	};

	const isHealthy = await adapter.healthCheck();

	t.false(isHealthy);
});

// ===========================
// getAvailableModels Tests
// ===========================

test('getAvailableModels returns empty array', async (t) => {
	const {adapter} = createTestAdapter();

	const models = await adapter.getAvailableModels();

	t.true(Array.isArray(models));
	t.is(models.length, 0);
});
