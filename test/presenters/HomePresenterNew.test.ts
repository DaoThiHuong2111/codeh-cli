/**
 * Integration tests for HomePresenterNew
 */

import test from 'ava';
import { HomePresenterNew } from '../../source/cli/presenters/HomePresenterNew.js';

// === Mock Dependencies ===

class MockCodehClient {
	async execute(input: string) {
		return {
			response: { role: 'assistant', content: `Mock response to: ${input}` },
			metadata: { duration: 100, tokenUsage: { total: 50 }, model: 'mock-model', finishReason: 'stop' },
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
			metadata: { duration: 100, tokenUsage: { total: 50 }, model: 'mock-model', finishReason: 'stop' },
		};
	}
}

class MockCommandRegistry {
	filter(query: string) {
		if (query.startsWith('/help')) {
			return [{ name: '/help', description: 'Show help' }];
		}
		return [];
	}

	getAll() {
		return [
			{ name: '/help', description: 'Show help' },
			{ name: '/clear', description: 'Clear conversation' },
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

test('initializes with empty state', (t) => {
	const presenter = createMockPresenter();

	t.is(presenter.input, '');
	t.is(presenter.inputError, '');
	t.is(presenter.messages.length, 0);
	t.is(presenter.isLoading, false);
	t.is(presenter.todos.length, 0);
});

test('initializes with config values', (t) => {
	const presenter = createMockPresenter();

	t.is(presenter.version, '1.0.0');
	t.is(presenter.model, 'mock-model');
	t.truthy(presenter.directory);
});

test('initializes stats to zero', (t) => {
	const presenter = createMockPresenter();

	t.is(presenter.totalTokens, 0);
	t.is(presenter.estimatedCost, 0);
	t.is(presenter.sessionDuration, 0);
});

// === Input Handling Tests ===

test('handleInputChange updates input', (t) => {
	const presenter = createMockPresenter();

	presenter.handleInputChange('test input');

	t.is(presenter.input, 'test input');
	t.is(presenter.inputError, '');
});

test('handleInputChange clears error', (t) => {
	const presenter = createMockPresenter();

	// Trigger error first
	presenter.handleSubmit('');

	t.truthy(presenter.inputError);

	// Now change input
	presenter.handleInputChange('new input');

	t.is(presenter.inputError, '');
});

test('handleInputChange filters slash commands', (t) => {
	const presenter = createMockPresenter();

	presenter.handleInputChange('/help');

	t.is(presenter.filteredSuggestions.length, 1);
	t.is(presenter.filteredSuggestions[0].name, '/help');
});

test('handleInputChange clears suggestions when not slash command', (t) => {
	const presenter = createMockPresenter();

	presenter.handleInputChange('/help');
	t.is(presenter.filteredSuggestions.length, 1);

	presenter.handleInputChange('regular input');
	t.is(presenter.filteredSuggestions.length, 0);
});

// === Submit Handling Tests ===

test('handleSubmit rejects empty input', async (t) => {
	const presenter = createMockPresenter();

	await presenter.handleSubmit('');

	t.truthy(presenter.inputError);
	t.is(presenter.messages.length, 0);
});

test('handleSubmit rejects whitespace-only input', async (t) => {
	const presenter = createMockPresenter();

	await presenter.handleSubmit('   ');

	t.truthy(presenter.inputError);
	t.is(presenter.messages.length, 0);
});

test('handleSubmit adds user message', async (t) => {
	const presenter = createMockPresenter();

	await presenter.handleSubmit('Hello');

	t.true(presenter.messages.length >= 1);
	t.is(presenter.messages[0].role, 'user');
	t.is(presenter.messages[0].content, 'Hello');
});

test('handleSubmit clears input after submission', async (t) => {
	const presenter = createMockPresenter();

	presenter.handleInputChange('Hello');
	await presenter.handleSubmit('Hello');

	t.is(presenter.input, '');
});

test('handleSubmit adds to input history', async (t) => {
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

test('navigateHistory with empty history does nothing', (t) => {
	const presenter = createMockPresenter();

	presenter.navigateHistory('up');

	t.is(presenter.input, '');
});

test('navigateHistory up shows previous input', async (t) => {
	const presenter = createMockPresenter();

	await presenter.handleSubmit('Test 1');
	await presenter.handleSubmit('Test 2');

	presenter.navigateHistory('up');

	t.is(presenter.input, 'Test 2');
});

test('navigateHistory down shows next input', async (t) => {
	const presenter = createMockPresenter();

	await presenter.handleSubmit('Test 1');
	await presenter.handleSubmit('Test 2');

	presenter.navigateHistory('up');
	presenter.navigateHistory('up');
	t.is(presenter.input, 'Test 1');

	presenter.navigateHistory('down');
	t.is(presenter.input, 'Test 2');
});

test('navigateHistory down from newest returns to empty', async (t) => {
	const presenter = createMockPresenter();

	await presenter.handleSubmit('Test');

	presenter.navigateHistory('up');
	t.is(presenter.input, 'Test');

	presenter.navigateHistory('down');
	t.is(presenter.input, '');
});

test('input history limited to 50 items', async (t) => {
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

test('addTodo adds todo to state', (t) => {
	const presenter = createMockPresenter();

	presenter.addTodo('New task');

	t.is(presenter.todos.length, 1);
	t.is(presenter.todos[0].content, 'New task');
	t.is(presenter.todos[0].status, 'pending');
});

test('addTodo with custom status', (t) => {
	const presenter = createMockPresenter();

	presenter.addTodo('Active task', 'in_progress');

	t.is(presenter.todos[0].status, 'in_progress');
});

test('updateTodoStatus updates correct todo', (t) => {
	const presenter = createMockPresenter();

	presenter.addTodo('Task 1');
	presenter.addTodo('Task 2');

	const todoId = presenter.todos[0].id;
	presenter.updateTodoStatus(todoId, 'completed');

	t.is(presenter.todos[0].status, 'completed');
	t.is(presenter.todos[1].status, 'pending'); // Others unchanged
});

test('updateTodoStatus preserves todo immutability', (t) => {
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

test('clearTodos removes all todos', (t) => {
	const presenter = createMockPresenter();

	presenter.addTodo('Task 1');
	presenter.addTodo('Task 2');
	presenter.addTodo('Task 3');

	presenter.clearTodos();

	t.is(presenter.todos.length, 0);
});

// === Help Overlay Tests ===

test('toggleHelp toggles help state', (t) => {
	const presenter = createMockPresenter();

	t.false(presenter.showHelp);

	presenter.toggleHelp();
	t.true(presenter.showHelp);

	presenter.toggleHelp();
	t.false(presenter.showHelp);
});

// === Suggestion Navigation Tests ===

test('hasSuggestions returns false when no suggestions', (t) => {
	const presenter = createMockPresenter();

	t.false(presenter.hasSuggestions());
});

test('hasSuggestions returns true when has suggestions', (t) => {
	const presenter = createMockPresenter();

	presenter.handleInputChange('/help');

	t.true(presenter.hasSuggestions());
});

test('navigateSuggestions changes selected index', (t) => {
	const presenter = createMockPresenter();

	presenter.handleInputChange('/');
	const initialIndex = presenter.selectedSuggestionIndex;

	presenter.navigateSuggestions('down');

	t.not(presenter.selectedSuggestionIndex, initialIndex);
});

// === View Update Callback Tests ===

test('setViewUpdateCallback registers callback', (t) => {
	const presenter = createMockPresenter();
	let callbackCalled = false;

	presenter.setViewUpdateCallback(() => {
		callbackCalled = true;
	});

	presenter.handleInputChange('test');

	t.true(callbackCalled);
});

test('view callback called on state changes', (t) => {
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

test('cleanup stops duration timer', async (t) => {
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

test('messageCount returns correct count', (t) => {
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

test('getters return current state values', (t) => {
	const presenter = createMockPresenter();

	t.is(presenter.input, '');
	t.is(presenter.isLoading, false);
	t.is(presenter.showHelp, false);
	t.is(presenter.totalTokens, 0);
	t.is(presenter.estimatedCost, 0);
});
