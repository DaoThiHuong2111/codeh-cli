/**
 * Tests for CodehClient
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {CodehClient} from '../../../dist/core/application/CodehClient.js';
import {ConversationContextService} from '../../../dist/core/application/services/ConversationContextService.js';
import {ToolExecutionOrchestrator} from '../../../dist/core/application/ToolExecutionOrchestrator.js';
import {InputClassifier} from '../../../dist/core/application/services/InputClassifier.js';
import {Message} from '../../../dist/core/domain/models/Message.js';
import {Turn} from '../../../dist/core/domain/models/Turn.js';
import {Configuration} from '../../../dist/core/domain/models/Configuration.js';
import {InputClassification, InputType} from '../../../dist/core/domain/valueObjects/InputType.js';

// ===========================
// Test Setup & Helpers
// ===========================

// Mock interfaces
const mockApiClient = {
	chat: sinon.stub(),
	streamChat: sinon.stub(),
	getProviderName: sinon.stub().returns('test-provider'),
	healthCheck: sinon.stub().resolves(true),
	getAvailableModels: sinon.stub().resolves(['model1']),
};

const mockHistoryRepo = {
	addMessage: sinon.stub().resolves(),
	getMessages: sinon.stub().resolves([]),
	clear: sinon.stub().resolves(),
	getConversationId: sinon.stub().returns('test-id'),
	setConversationId: sinon.stub(),
	loadHistory: sinon.stub().resolves(),
	saveHistory: sinon.stub().resolves(),
};

const mockConfig = Configuration.create({
	provider: 'anthropic',
	model: 'claude-3',
	apiKey: 'test-key',
	maxTokens: 1000,
	temperature: 0.5,
});

const mockToolRegistry = {
	getDefinitions: sinon.stub().returns([]),
	getTool: sinon.stub(),
	registerTool: sinon.stub(),
	hasTool: sinon.stub(),
};

const mockPermissionHandler = {
	checkPermission: sinon.stub().resolves(true),
	askPermission: sinon.stub().resolves(true),
};

test.afterEach(() => {
	sinon.restore();
	mockApiClient.chat.reset();
	mockApiClient.streamChat.reset();
	mockHistoryRepo.addMessage.reset();
});

// ===========================
// Initialization Tests
// ===========================

test.serial('initializes correctly', (t) => {
	const client = new CodehClient(
		mockApiClient as any,
		mockHistoryRepo as any,
		mockConfig
	);
	t.truthy(client);
	t.is(client.getApiClient(), mockApiClient as any);
	t.is(client.getHistoryRepository(), mockHistoryRepo as any);
});

// ===========================
// Execute Tests (Non-streaming)
// ===========================

test.serial('execute handles validation failure', async (t) => {
	// Stub InputClassifier to fail
	sinon.stub(InputClassifier.prototype, 'validate').returns({
		valid: false,
		errors: ['Invalid input'],
		warnings: [],
		classification: new InputClassification(InputType.TEXT, 1)
	});

	const client = new CodehClient(
		mockApiClient as any,
		mockHistoryRepo as any,
		mockConfig
	);

	const turn = await client.execute('');

	t.is(turn.response?.content.includes('Input validation failed'), true);
	t.is(turn.response?.content.includes('Invalid input'), true);
	t.true(mockApiClient.chat.notCalled);
});

test.serial('execute performs successful chat interaction', async (t) => {
	// Stub dependencies
	sinon.stub(InputClassifier.prototype, 'validate').returns({valid: true, errors: [], warnings: [], classification: new InputClassification(InputType.TEXT, 1)});
	sinon.stub(ConversationContextService.prototype, 'getMessagesForLLM').resolves([]);
	
	mockApiClient.chat.resolves({
		content: 'AI Response',
		model: 'claude-3',
		usage: {promptTokens: 10, completionTokens: 20, totalTokens: 30},
		finishReason: 'stop'
	});

	const client = new CodehClient(
		mockApiClient as any,
		mockHistoryRepo as any,
		mockConfig
	);

	const turn = await client.execute('Hello');

	t.is(turn.request.content, 'Hello');
	t.is(turn.response?.content, 'AI Response');
	t.true(mockApiClient.chat.calledOnce);
	t.true(mockHistoryRepo.addMessage.calledTwice); // Request + Response
});

test.serial('execute handles API errors', async (t) => {
	sinon.stub(InputClassifier.prototype, 'validate').returns({valid: true, errors: [], warnings: [], classification: new InputClassification(InputType.TEXT, 1)});
	sinon.stub(ConversationContextService.prototype, 'getMessagesForLLM').resolves([]);
	
	mockApiClient.chat.rejects(new Error('API Error'));

	const client = new CodehClient(
		mockApiClient as any,
		mockHistoryRepo as any,
		mockConfig
	);

	const turn = await client.execute('Hello');

	t.is(turn.response?.content, 'Error: API Error');
	// Should not save response to history on error (based on implementation logic check)
	// Wait, implementation creates errorMsg and returns Turn, but does NOT save to historyRepo in catch block
	// Let's verify implementation:
	// catch (error) { return Turn.create... } -> No historyRepo.addMessage call
	t.true(mockHistoryRepo.addMessage.notCalled); 
	// Actually request might not be saved either if error happens before
	// Implementation saves request AND response AFTER api call succeeds.
	// So if API fails, nothing is saved.
});

test.serial('execute handles tool calls', async (t) => {
	sinon.stub(InputClassifier.prototype, 'validate').returns({valid: true, errors: [], warnings: [], classification: {type: 'general', confidence: 1}});
	sinon.stub(ConversationContextService.prototype, 'getMessagesForLLM').resolves([]);
	
	// Mock API response with tool calls
	mockApiClient.chat.resolves({
		content: 'Using tool',
		model: 'claude-3',
		toolCalls: [{id: '1', name: 'test-tool', arguments: {}}],
		finishReason: 'tool_calls'
	});

	// Mock orchestrator
	const orchestrateStub = sinon.stub(ToolExecutionOrchestrator.prototype, 'orchestrate').resolves({
		finalTurn: Turn.create(Message.user('Hello'))
			.withResponse(Message.assistant('Tool Result'))
			.withToolCalls([{id: '1', name: 'test-tool', arguments: {}}]),
		executionContexts: [],
		iterations: 1
	});

	const client = new CodehClient(
		mockApiClient as any,
		mockHistoryRepo as any,
		mockConfig,
		mockToolRegistry as any,
		mockPermissionHandler as any
	);

	const turn = await client.execute('Use tool');

	t.true(orchestrateStub.calledOnce);
	t.is(turn.response?.content, 'Tool Result');
});

// ===========================
// Execute Streaming Tests
// ===========================

test.serial('executeWithStreaming streams response', async (t) => {
	sinon.stub(InputClassifier.prototype, 'validate').returns({valid: true, errors: [], warnings: [], classification: {type: 'general', confidence: 1}});
	sinon.stub(ConversationContextService.prototype, 'getMessagesForLLM').resolves([]);
	
	// Mock streamChat to call onChunk
	mockApiClient.streamChat.callsFake(async (req, onChunk) => {
		onChunk({content: 'Chunk 1'});
		onChunk({content: 'Chunk 2'});
		onChunk({usage: {promptTokens: 10, completionTokens: 20, totalTokens: 30}});
		return {
			content: 'Chunk 1Chunk 2',
			model: 'claude-3',
			finishReason: 'stop'
		};
	});

	const client = new CodehClient(
		mockApiClient as any,
		mockHistoryRepo as any,
		mockConfig
	);

	const chunks: string[] = [];
	const turn = await client.executeWithStreaming('Hello', (chunk) => chunks.push(chunk));

	t.deepEqual(chunks, ['Chunk 1', 'Chunk 2']);
	t.is(turn.response?.content, 'Chunk 1Chunk 2');
	t.true(mockHistoryRepo.addMessage.calledTwice);
});

test.serial('executeWithStreaming handles validation failure', async (t) => {
	sinon.stub(InputClassifier.prototype, 'validate').returns({
		valid: false,
		errors: ['Invalid input'],
		warnings: [],
		classification: new InputClassification(InputType.TEXT, 1)
	});

	const client = new CodehClient(
		mockApiClient as any,
		mockHistoryRepo as any,
		mockConfig
	);

	const chunks: string[] = [];
	const turn = await client.executeWithStreaming('', (chunk) => chunks.push(chunk));

	t.is(chunks.length, 0); // No chunks for validation error
	t.true(turn.response?.content.includes('Input validation failed'));
});

test.serial('executeWithStreaming handles tool calls', async (t) => {
	sinon.stub(InputClassifier.prototype, 'validate').returns({valid: true, errors: [], warnings: [], classification: new InputClassification(InputType.TEXT, 1)});
	sinon.stub(ConversationContextService.prototype, 'getMessagesForLLM').resolves([]);
	
	mockApiClient.streamChat.resolves({
		content: 'Using tool',
		model: 'claude-3',
		toolCalls: [{id: '1', name: 'test-tool', arguments: {}}],
		finishReason: 'tool_calls'
	});

	const orchestrateStub = sinon.stub(ToolExecutionOrchestrator.prototype, 'orchestrate').resolves({
		finalTurn: Turn.create(Message.user('Hello'))
			.withResponse(Message.assistant('Tool Result')),
		executionContexts: [],
		iterations: 1
	});

	const client = new CodehClient(
		mockApiClient as any,
		mockHistoryRepo as any,
		mockConfig,
		mockToolRegistry as any,
		mockPermissionHandler as any
	);

	await client.executeWithStreaming('Use tool', () => {});

	t.true(orchestrateStub.calledOnce);
});
