/**
 * Tests for ToolExecutionOrchestrator
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {ToolExecutionOrchestrator} from '../../../dist/core/application/ToolExecutionOrchestrator.js';
import {HandleToolCalls} from '../../../dist/core/application/usecases/HandleToolCalls.js';
import {Turn} from '../../../dist/core/domain/models/Turn.js';
import {Message} from '../../../dist/core/domain/models/Message.js';
import {ToolExecutionContext} from '../../../dist/core/domain/models/ToolExecutionContext.js';

// ===========================
// Test Setup & Helpers
// ===========================

// Subclass to expose private members for mocking
class TestToolExecutionOrchestrator extends ToolExecutionOrchestrator {
	constructor(
		toolRegistry: any,
		permissionHandler: any,
		apiClient: any,
		historyRepo: any,
		contextService: any,
		config: any
	) {
		super(toolRegistry, permissionHandler, apiClient, historyRepo, contextService, config);
		// Replace handleToolCalls with a mockable object
		(this as any).handleToolCalls = {
			execute: sinon.stub(),
			executeParallel: sinon.stub()
		};
	}

	get handleToolCallsMock(): any {
		return (this as any).handleToolCalls;
	}
}

const mockToolRegistry = {
	getDefinitions: sinon.stub().returns([])
};

const mockPermissionHandler = {};

const mockApiClient = {
	chat: sinon.stub(),
	streamChat: sinon.stub()
};

const mockHistoryRepo = {
	addMessage: sinon.stub().resolves()
};

const mockContextService = {
	getMessagesForLLM: sinon.stub().resolves([])
};

test.afterEach(() => {
	sinon.restore();
	mockApiClient.chat.reset();
	mockApiClient.streamChat.reset();
	mockHistoryRepo.addMessage.reset();
});

function createOrchestrator(config = {}) {
	return new TestToolExecutionOrchestrator(
		mockToolRegistry,
		mockPermissionHandler,
		mockApiClient,
		mockHistoryRepo,
		mockContextService,
		config
	);
}

// ===========================
// Orchestration Logic Tests
// ===========================

test.serial('orchestrate returns immediately if no tool calls', async (t) => {
	const orchestrator = createOrchestrator();
	const turn = Turn.create(Message.user('Hello'))
		.withResponse(Message.assistant('Hi'));
	
	const result = await orchestrator.orchestrate(turn);
	
	// Iterations is 1 because it enters the loop, checks for tools, and breaks
	t.is(result.iterations, 1);
	t.is(result.executionContexts.length, 0);
	t.is(result.finalTurn, turn);
});

test.serial('orchestrate handles tool rejection', async (t) => {
	const orchestrator = createOrchestrator();
	
	const initialTurn = Turn.create(Message.user('Use risky tool'))
		.withResponse(Message.assistant('Using risky tool', [{id: '1', name: 'risky', arguments: {}}]));
	
	let toolContext = ToolExecutionContext.create({id: '1', name: 'risky', arguments: {}});
	toolContext = toolContext.withPermissionRejected();
	
	orchestrator.handleToolCallsMock.execute.resolves({
		contexts: [toolContext],
		allApproved: false
	});
	
	mockApiClient.chat.resolves({
		content: 'I understand, I will not use that tool.',
		toolCalls: []
	});
	
	const result = await orchestrator.orchestrate(initialTurn);
	
	// Iteration 1: Detects tool -> Rejects -> Sends feedback -> Continues
	// Iteration 2: Checks response (no tools) -> Breaks
	t.is(result.iterations, 2);
	t.is(result.finalTurn.response?.content, 'I understand, I will not use that tool.');
	
	// Should have sent rejection feedback
	const chatArgs = mockApiClient.chat.firstCall.args[0];
	// Check all messages for rejection content
	const hasRejection = chatArgs.messages.some((m: any) => m.content.includes('was rejected'));
	t.true(hasRejection);
});

test.serial('orchestrate handles tool failure', async (t) => {
	const orchestrator = createOrchestrator();
	
	const initialTurn = Turn.create(Message.user('Use broken tool'))
		.withResponse(Message.assistant('Using broken tool', [{id: '1', name: 'broken', arguments: {}}]));
	
	let toolContext = ToolExecutionContext.create({id: '1', name: 'broken', arguments: {}});
	toolContext = toolContext.withError('Error: Tool crashed');
	
	orchestrator.handleToolCallsMock.execute.resolves({
		contexts: [toolContext],
		allApproved: true // Approved but failed execution
	});
	
	mockApiClient.chat.resolves({
		content: 'Tool failed, retrying...',
		toolCalls: []
	});
	
	const result = await orchestrator.orchestrate(initialTurn);
	
	// Iteration 1: Detects tool -> Executes (fails) -> Sends result -> LLM responds (no tools) -> Breaks
	t.is(result.iterations, 1);
	
	// Should have sent error feedback
	const chatArgs = mockApiClient.chat.firstCall.args[0];
	// Check all messages for error content
	const hasError = chatArgs.messages.some((m: any) => m.content.includes('failed: Error: Tool crashed'));
	t.true(hasError);
});

// ===========================
// Streaming Support Tests
// ===========================

test.serial('orchestrate supports streaming continuation', async (t) => {
	const orchestrator = createOrchestrator();
	
	const initialTurn = Turn.create(Message.user('Stream tool'))
		.withResponse(Message.assistant('Using tool', [{id: '1', name: 'tool1', arguments: {}}]));
	
	let toolContext = ToolExecutionContext.create({id: '1', name: 'tool1', arguments: {}});
	toolContext = toolContext.withResult({success: true, output: 'Output'});
	
	orchestrator.handleToolCallsMock.execute.resolves({
		contexts: [toolContext],
		allApproved: true
	});
	
	mockApiClient.streamChat.callsFake(async (req, onChunk) => {
		onChunk({content: 'Streamed'});
		onChunk({content: ' Response'});
		return {content: 'Streamed Response', toolCalls: []};
	});
	
	const chunks: string[] = [];
	await orchestrator.orchestrate(
		initialTurn,
		undefined,
		(chunk) => chunks.push(chunk)
	);
	
	t.deepEqual(chunks, ['Streamed', ' Response']);
	t.true(mockApiClient.streamChat.calledOnce);
});

// ===========================
// Parallel Execution Tests
// ===========================

test.serial('orchestrate uses parallel execution when configured', async (t) => {
	const orchestrator = createOrchestrator({parallel: true});
	
	const initialTurn = Turn.create(Message.user('Parallel'))
		.withResponse(Message.assistant('Using tools', [
			{id: '1', name: 't1', arguments: {}},
			{id: '2', name: 't2', arguments: {}}
		]));
	
	orchestrator.handleToolCallsMock.executeParallel.resolves({
		contexts: [],
		allApproved: true
	});
	
	mockApiClient.chat.resolves({content: 'Done', toolCalls: []});
	
	await orchestrator.orchestrate(initialTurn);
	
	t.true(orchestrator.handleToolCallsMock.executeParallel.calledOnce);
	t.true(orchestrator.handleToolCallsMock.execute.notCalled);
});
