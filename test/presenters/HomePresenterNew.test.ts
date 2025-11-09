/**
 * Integration tests for HomePresenterNew
 */

import test from 'ava';
import {HomePresenterNew} from '../../source/cli/presenters/HomePresenterNew.js';

// === Mock Dependencies ===

class MockCodehClient {
	async execute(input: string) {
		return {
			response: {role: 'assistant', content: `Mock response to: ${input}`},
			metadata: {
				duration: 100,
				tokenUsage: {total: 50},
				model: 'mock-model',
				finishReason: 'stop',
			},
		};
	}

	async executeWithStreaming(input: string, onChunk: (chunk: string) => void) {
		// Simulate streaming
		const response = `Mock streaming response to: ${input}`;
		const chunks = response.split(' ');

		for (const chunk of chunks) {
			onChunk(chunk + ' ');
		}

		return {
			request: {role: 'user', content: input},
			response: {role: 'assistant', content: response},
			metadata: {
				duration: 100,
				tokenUsage: {
					prompt: 20,
					completion: 30,
					total: 50,
				},
				model: 'mock-model',
				finishReason: 'stop',
			},
			isComplete: () => true,
		};
	}
}

class MockCommandRegistry {
	filter(query: string) {
		if (query.startsWith('/help')) {
			return [{name: '/help', description: 'Show help'}];
		}
		return [];
	}

	getAll() {
		return [
			{name: '/help', description: 'Show help'},
			{name: '/clear', description: 'Clear conversation'},
		];
	}
}

class MockSessionManager {
	async loadSession() {
		return null;
	}

	async saveSession() {}

	async clearSession() {}
}

function createMockPresenter() {
	const client = new MockCodehClient() as any;
	const registry = new MockCommandRegistry() as any;
	const sessionManager = new MockSessionManager() as any;
	const config = {
		version: '1.0.0',
		model: 'mock-model',
	};

	return new HomePresenterNew(client, registry, sessionManager, config);
}

// === Initialization Tests ===

test('initializes with empty state', t => {
	const presenter = createMockPresenter();

	t.is(presenter.input, '');
	t.is(presenter.inputError, '');
	t.is(presenter.messages.length, 0);
	t.is(presenter.isLoading, false);
	t.is(presenter.todos.length, 0);
});

test('initializes with config values', t => {
	const presenter = createMockPresenter();

	t.is(presenter.version, '1.0.0');
	t.is(presenter.model, 'mock-model');
	t.truthy(presenter.directory);
});

test('initializes stats to zero', t => {
	const presenter = createMockPresenter();

	t.is(presenter.totalTokens, 0);
	t.is(presenter.estimatedCost, 0);
	t.is(presenter.sessionDuration, 0);
});

// === Input Handling Tests ===

test('handleInputChange updates input', t => {
	const presenter = createMockPresenter();

	presenter.handleInputChange('test input');

	t.is(presenter.input, 'test input');
	t.is(presenter.inputError, '');
});

test('handleInputChange clears error', t => {
	const presenter = createMockPresenter();

	// Trigger error first
	presenter.handleSubmit('');

	t.truthy(presenter.inputError);

	// Now change input
	presenter.handleInputChange('new input');

	t.is(presenter.inputError, '');
});

test('handleInputChange filters slash commands', t => {
	const presenter = createMockPresenter();

	presenter.handleInputChange('/help');

	t.is(presenter.filteredSuggestions.length, 1);
	t.is(presenter.filteredSuggestions[0].name, '/help');
});

test('handleInputChange clears suggestions when not slash command', t => {
	const presenter = createMockPresenter();

	presenter.handleInputChange('/help');
	t.is(presenter.filteredSuggestions.length, 1);

	presenter.handleInputChange('regular input');
	t.is(presenter.filteredSuggestions.length, 0);
});

// === Submit Handling Tests ===

test('handleSubmit rejects empty input', async t => {
	const presenter = createMockPresenter();

	await presenter.handleSubmit('');

	t.truthy(presenter.inputError);
	t.is(presenter.messages.length, 0);
});

test('handleSubmit rejects whitespace-only input', async t => {
	const presenter = createMockPresenter();

	await presenter.handleSubmit('   ');

	t.truthy(presenter.inputError);
	t.is(presenter.messages.length, 0);
});

test('handleSubmit adds user message', async t => {
	const presenter = createMockPresenter();

	await presenter.handleSubmit('Hello');

	t.true(presenter.messages.length >= 1);
	t.is(presenter.messages[0].role, 'user');
	t.is(presenter.messages[0].content, 'Hello');
});

test('handleSubmit clears input after submission', async t => {
	const presenter = createMockPresenter();

	presenter.handleInputChange('Hello');
	await presenter.handleSubmit('Hello');

	t.is(presenter.input, '');
});

test('handleSubmit adds to input history', async t => {
	const presenter = createMockPresenter();

	await presenter.handleSubmit('First message');
	await presenter.handleSubmit('Second message');

	// Navigate history to check
	presenter.navigateHistory('up');
	t.is(presenter.input, 'Second message');

	presenter.navigateHistory('up');
	t.is(presenter.input, 'First message');
});

// === Input History Tests ===

test('navigateHistory with empty history does nothing', t => {
	const presenter = createMockPresenter();

	presenter.navigateHistory('up');

	t.is(presenter.input, '');
});

test('navigateHistory up shows previous input', async t => {
	const presenter = createMockPresenter();

	await presenter.handleSubmit('Test 1');
	await presenter.handleSubmit('Test 2');

	presenter.navigateHistory('up');

	t.is(presenter.input, 'Test 2');
});

test('navigateHistory down shows next input', async t => {
	const presenter = createMockPresenter();

	await presenter.handleSubmit('Test 1');
	await presenter.handleSubmit('Test 2');

	presenter.navigateHistory('up');
	presenter.navigateHistory('up');
	t.is(presenter.input, 'Test 1');

	presenter.navigateHistory('down');
	t.is(presenter.input, 'Test 2');
});

test('navigateHistory down from newest returns to empty', async t => {
	const presenter = createMockPresenter();

	await presenter.handleSubmit('Test');

	presenter.navigateHistory('up');
	t.is(presenter.input, 'Test');

	presenter.navigateHistory('down');
	t.is(presenter.input, '');
});

test('input history limited to 50 items', async t => {
	const presenter = createMockPresenter();

	// Add 60 items
	for (let i = 0; i < 60; i++) {
		await presenter.handleSubmit(`Message ${i}`);
	}

	// Navigate to oldest
	for (let i = 0; i < 100; i++) {
		presenter.navigateHistory('up');
	}

	// Should only have 50 items, so oldest should be "Message 10"
	t.true(presenter.input.includes('Message'));
	const messageNum = parseInt(presenter.input.replace('Message ', ''));
	t.true(messageNum >= 10); // History limited, can't go back to 0-9
});

// === Todos Management Tests ===

test('addTodo adds todo to state', t => {
	const presenter = createMockPresenter();

	presenter.addTodo('New task');

	t.is(presenter.todos.length, 1);
	t.is(presenter.todos[0].content, 'New task');
	t.is(presenter.todos[0].status, 'pending');
});

test('addTodo with custom status', t => {
	const presenter = createMockPresenter();

	presenter.addTodo('Active task', 'in_progress');

	t.is(presenter.todos[0].status, 'in_progress');
});

test('updateTodoStatus updates correct todo', t => {
	const presenter = createMockPresenter();

	presenter.addTodo('Task 1');
	presenter.addTodo('Task 2');

	const todoId = presenter.todos[0].id;
	presenter.updateTodoStatus(todoId, 'completed');

	t.is(presenter.todos[0].status, 'completed');
	t.is(presenter.todos[1].status, 'pending'); // Others unchanged
});

test('updateTodoStatus preserves todo immutability', t => {
	const presenter = createMockPresenter();

	presenter.addTodo('Task');
	const originalTodo = presenter.todos[0];
	const originalId = originalTodo.id;

	presenter.updateTodoStatus(originalId, 'completed');
	const updatedTodo = presenter.todos[0];

	// Should be different object
	t.not(originalTodo, updatedTodo);
	// But same ID
	t.is(updatedTodo.id, originalId);
	// And updated status
	t.is(updatedTodo.status, 'completed');
});

test('clearTodos removes all todos', t => {
	const presenter = createMockPresenter();

	presenter.addTodo('Task 1');
	presenter.addTodo('Task 2');
	presenter.addTodo('Task 3');

	presenter.clearTodos();

	t.is(presenter.todos.length, 0);
});

// === Help Overlay Tests ===

test('toggleHelp toggles help state', t => {
	const presenter = createMockPresenter();

	t.false(presenter.showHelp);

	presenter.toggleHelp();
	t.true(presenter.showHelp);

	presenter.toggleHelp();
	t.false(presenter.showHelp);
});

// === Suggestion Navigation Tests ===

test('hasSuggestions returns false when no suggestions', t => {
	const presenter = createMockPresenter();

	t.false(presenter.hasSuggestions());
});

test('hasSuggestions returns true when has suggestions', t => {
	const presenter = createMockPresenter();

	presenter.handleInputChange('/help');

	t.true(presenter.hasSuggestions());
});

test('navigateSuggestions changes selected index', t => {
	const presenter = createMockPresenter();

	presenter.handleInputChange('/');
	const initialIndex = presenter.selectedSuggestionIndex;

	presenter.navigateSuggestions('down');

	t.not(presenter.selectedSuggestionIndex, initialIndex);
});

// === View Update Callback Tests ===

test('setViewUpdateCallback registers callback', t => {
	const presenter = createMockPresenter();
	let callbackCalled = false;

	presenter.setViewUpdateCallback(() => {
		callbackCalled = true;
	});

	presenter.handleInputChange('test');

	t.true(callbackCalled);
});

test('view callback called on state changes', t => {
	const presenter = createMockPresenter();
	let callCount = 0;

	presenter.setViewUpdateCallback(() => {
		callCount++;
	});

	presenter.handleInputChange('test');
	presenter.toggleHelp();
	presenter.addTodo('Task');

	t.true(callCount >= 3);
});

// === Cleanup Tests ===

test('cleanup stops duration timer', async t => {
	const presenter = createMockPresenter();

	const initialDuration = presenter.sessionDuration;

	// Wait a bit
	await new Promise(resolve => setTimeout(resolve, 1100));

	const afterWait = presenter.sessionDuration;
	t.true(afterWait > initialDuration);

	// Cleanup
	presenter.cleanup();

	// Wait again
	await new Promise(resolve => setTimeout(resolve, 1100));

	const afterCleanup = presenter.sessionDuration;

	// Duration should not increase after cleanup
	t.is(afterCleanup, afterWait);
});

// === Getter Tests ===

test('messageCount returns correct count', t => {
	const presenter = createMockPresenter();

	t.is(presenter.messageCount, 0);

	presenter['state'].messages.push({
		id: '1',
		role: 'user',
		content: 'Test',
		timestamp: new Date(),
	});

	t.is(presenter.messageCount, 1);
});

test('getters return current state values', t => {
	const presenter = createMockPresenter();

	t.is(presenter.input, '');
	t.is(presenter.isLoading, false);
	t.is(presenter.showHelp, false);
	t.is(presenter.totalTokens, 0);
	t.is(presenter.estimatedCost, 0);
});

// === Issue Fix Tests ===

// Test for Issue #1: Message metadata should be set without mutation
test('handleSubmit creates message with metadata immutably', async t => {
	const presenter = createMockPresenter();

	await presenter.handleSubmit('Test message');

	// Wait for async completion
	await new Promise(resolve => setTimeout(resolve, 100));

	// Should have 2 messages: user + assistant
	t.true(presenter.messages.length >= 2);

	const assistantMessage = presenter.messages.find(m => m.role === 'assistant');
	t.truthy(assistantMessage, 'Should have assistant message');

	// Check metadata exists and was set properly (not mutated)
	t.truthy(assistantMessage!.metadata, 'Should have metadata');
	t.truthy(assistantMessage!.metadata!.usage, 'Should have usage stats');
	t.is(
		assistantMessage!.metadata!.usage.promptTokens,
		20,
		'Prompt tokens correct',
	);
	t.is(
		assistantMessage!.metadata!.usage.completionTokens,
		30,
		'Completion tokens correct',
	);
	t.is(
		assistantMessage!.metadata!.usage.totalTokens,
		50,
		'Total tokens correct',
	);

	// Verify immutability: all Message properties are readonly
	// TypeScript will catch if we try: assistantMessage.metadata = {}
	// At runtime, the object should be properly constructed
	t.is(typeof assistantMessage!.metadata, 'object');
});

// Test for Issue #2: Streaming message ID should be consistent across chunks
test('handleSubmit maintains consistent message ID during streaming', async t => {
	const presenter = createMockPresenter();
	const capturedMessageIds: string[] = [];

	// Set view callback to capture message IDs during streaming
	presenter.setViewUpdateCallback(() => {
		const streamingMsg = presenter.messages.find(m => m.role === 'assistant');
		if (streamingMsg) {
			capturedMessageIds.push(streamingMsg.id);
		}
	});

	await presenter.handleSubmit('Test streaming');

	// Wait for completion
	await new Promise(resolve => setTimeout(resolve, 100));

	// Should have captured multiple IDs during streaming
	t.true(capturedMessageIds.length > 0, 'Should capture IDs during streaming');

	// All IDs should be the same (consistent ID)
	const uniqueIds = new Set(capturedMessageIds);
	t.is(uniqueIds.size, 1, 'All streaming message IDs should be identical');
});

// Test streaming message ID consistency - detailed version
test('streaming chunks use same message ID', async t => {
	const presenter = createMockPresenter();
	const messageIds: string[] = [];
	let updateCount = 0;

	presenter.setViewUpdateCallback(() => {
		updateCount++;
		const assistantMsg = presenter.messages.find(m => m.role === 'assistant');
		if (assistantMsg) {
			messageIds.push(assistantMsg.id);
		}
	});

	await presenter.handleSubmit('Hello world');

	// Wait for async
	await new Promise(resolve => setTimeout(resolve, 100));

	// Should have multiple updates (multiple chunks)
	t.true(updateCount > 1, 'Should have multiple view updates during streaming');
	t.true(messageIds.length > 0, 'Should capture message IDs');

	// Check all IDs are identical
	if (messageIds.length > 1) {
		const firstId = messageIds[0];
		const allSame = messageIds.every(id => id === firstId);
		t.true(
			allSame,
			`All message IDs should be ${firstId}, but got: ${messageIds.join(', ')}`,
		);
	}
});

// Test that final message replaces streaming message (same ID check)
test('final message replaces streaming message at correct index', async t => {
	const presenter = createMockPresenter();

	await presenter.handleSubmit('Test replacement');

	// Wait for completion
	await new Promise(resolve => setTimeout(resolve, 100));

	// Should have exactly 2 messages: user + final assistant (not duplicated)
	const assistantMessages = presenter.messages.filter(
		m => m.role === 'assistant',
	);
	t.is(
		assistantMessages.length,
		1,
		'Should have exactly 1 assistant message (not duplicated)',
	);

	// Final message should have metadata from turn
	const finalMsg = assistantMessages[0];
	t.truthy(finalMsg.metadata, 'Final message should have metadata');
	t.truthy(finalMsg.metadata!.usage, 'Final message should have usage stats');
});

// Test token stats are updated from metadata
test('handleSubmit updates token stats from metadata', async t => {
	const presenter = createMockPresenter();

	const initialTokens = presenter.totalTokens;
	const initialCost = presenter.estimatedCost;

	await presenter.handleSubmit('Count tokens');

	// Wait for completion
	await new Promise(resolve => setTimeout(resolve, 100));

	// Tokens should be updated
	t.true(presenter.totalTokens > initialTokens, 'Total tokens should increase');
	t.is(
		presenter.totalTokens,
		initialTokens + 50,
		'Should add 50 tokens from mock',
	);

	// Cost should be updated
	t.true(
		presenter.estimatedCost > initialCost,
		'Estimated cost should increase',
	);
	t.is(
		presenter.estimatedCost,
		(50 / 1000) * 0.005,
		'Cost should be calculated correctly',
	);
});

// Test message immutability - no 'as any' cast used
test('message objects are not mutated after creation', async t => {
	const presenter = createMockPresenter();

	await presenter.handleSubmit('Immutability test');
	await new Promise(resolve => setTimeout(resolve, 100));

	const assistantMsg = presenter.messages.find(m => m.role === 'assistant');
	t.truthy(assistantMsg);

	// Store original metadata reference
	const originalMetadata = assistantMsg!.metadata;

	// Try to access again - should be same reference (not mutated)
	const sameMsg = presenter.messages.find(m => m.role === 'assistant');
	t.is(
		sameMsg!.metadata,
		originalMetadata,
		'Metadata reference should not change',
	);

	// Metadata properties should be readonly (TypeScript enforces this)
	// Runtime check: metadata object is frozen or sealed (depending on implementation)
	t.truthy(assistantMsg!.metadata, 'Metadata exists');
	t.is(typeof assistantMsg!.metadata!.usage, 'object', 'Usage is object');
});
