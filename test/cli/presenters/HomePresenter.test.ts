/**
 * Tests for HomePresenter
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {HomePresenter} from '../../../dist/cli/presenters/HomePresenter.js';
import {CodehClient} from '../../../dist/core/application/CodehClient.js';
import {Session} from '../../../dist/core/domain/models/Session.js';
import {Message} from '../../../dist/core/domain/models/Message.js';
import {InputHistoryService} from '../../../dist/core/application/services/InputHistoryService.js';

interface Context {
	mockClient: any;
	mockCommandRegistry: any;
	mockSessionManager: any;
	mockInputHistory: any;
	mockHistoryRepo: any;
}

let clock: sinon.SinonFakeTimers | undefined;

test.serial.beforeEach<Context>(t => {
	// Ensure previous clock is restored
	if (clock) {
		clock.restore();
		clock = undefined;
	}

	// Reset stubs
	sinon.reset();
	clock = sinon.useFakeTimers();

	const mockHistoryRepo = {
		startNewConversation: sinon.stub().resolves(),
		addMessage: sinon.stub().resolves(),
		getHistory: sinon.stub().resolves({messages: []})
	};

	t.context = {
		mockClient: {
			executeWithStreaming: sinon.stub(),
			getHistoryRepository: sinon.stub().returns(mockHistoryRepo)
		},
		mockCommandRegistry: {
			get: sinon.stub(),
			filter: sinon.stub().returns([]),
			register: sinon.stub()
		},
		mockSessionManager: {
			saveWithTimestamp: sinon.stub().resolves('session_123'),
			load: sinon.stub(),
			list: sinon.stub().resolves([]),
			init: sinon.stub().resolves(),
			save: sinon.stub().resolves()
		},
		mockInputHistory: {
			add: sinon.stub(),
			getPrevious: sinon.stub(),
			getNext: sinon.stub()
		},
		mockHistoryRepo
	};
});

test.serial.afterEach(t => {
	if (clock) {
		clock.restore();
		clock = undefined;
	}
	sinon.restore();
});

test.serial('initializes with default state', t => {
	const {mockClient, mockCommandRegistry, mockSessionManager, mockInputHistory} = t.context as Context;
	const presenter = new HomePresenter(
		mockClient,
		mockCommandRegistry,
		mockSessionManager,
		{model: 'gpt-4'},
		mockInputHistory
	);

	t.is(presenter.model, 'gpt-4');
	t.is(presenter.input, '');
	t.false(presenter.isLoading);
});

test.serial('handleInputChange updates input and filters suggestions', t => {
	const {mockClient, mockCommandRegistry, mockSessionManager, mockInputHistory} = t.context as Context;
	const presenter = new HomePresenter(
		mockClient,
		mockCommandRegistry,
		mockSessionManager,
		{},
		mockInputHistory
	);

	presenter.handleInputChange('hello');
	t.is(presenter.input, 'hello');
	t.true(mockCommandRegistry.filter.notCalled);

	mockCommandRegistry.filter.returns([{cmd: '/help'}]);
	presenter.handleInputChange('/he');
	t.is(presenter.input, '/he');
	t.true(mockCommandRegistry.filter.calledWith('/he'));
	t.is(presenter.filteredSuggestions.length, 1);
});

test.serial('handleSubmit executes client request', async t => {
	const {mockClient, mockCommandRegistry, mockSessionManager, mockInputHistory} = t.context as Context;
	const presenter = new HomePresenter(
		mockClient,
		mockCommandRegistry,
		mockSessionManager,
		{},
		mockInputHistory
	);

	// Mock streaming response
	const mockTurn = {
		isComplete: () => true,
		response: {content: 'AI response', toolCalls: []},
		metadata: {tokenUsage: {total: 10}}
	};
	
	mockClient.executeWithStreaming.callsFake(async (input: any, onChunk: any) => {
		onChunk('AI');
		onChunk(' response');
		return mockTurn;
	});

	presenter.handleInputChange('Hello AI');
	await presenter.handleSubmit('Hello AI');

	t.true(mockClient.executeWithStreaming.calledWith('Hello AI'));
	t.true(mockInputHistory.add.calledWith('Hello AI'));
	
	// Verify message added to session
	const messages = presenter.session.getMessages();
	t.is(messages.length, 2); // User + Assistant
	t.is(messages[0].content, 'Hello AI');
	t.is(messages[1].content, 'AI response');
});

test.serial('handleSubmit handles empty input', async t => {
	const {mockClient, mockCommandRegistry, mockSessionManager, mockInputHistory} = t.context as Context;
	const presenter = new HomePresenter(
		mockClient,
		mockCommandRegistry,
		mockSessionManager,
		{},
		mockInputHistory
	);

	await presenter.handleSubmit('');
	t.is(presenter.inputError, 'Please enter a message');
	t.true(mockClient.executeWithStreaming.notCalled);
});

test.serial('handleSubmit handles slash commands', async t => {
	const {mockClient, mockCommandRegistry, mockSessionManager, mockInputHistory} = t.context as Context;
	const presenter = new HomePresenter(
		mockClient,
		mockCommandRegistry,
		mockSessionManager,
		{},
		mockInputHistory
	);

	const mockCommand = {
		execute: sinon.stub().resolves()
	};
	mockCommandRegistry.get.withArgs('/help').returns(mockCommand);

	presenter.handleInputChange('/help me');
	await presenter.handleSubmit('/help me');
	
	t.true(mockCommand.execute.called);
	t.true(mockClient.executeWithStreaming.notCalled);
	t.is(presenter.input, '');
});

test.serial('handleSuggestionNavigate navigates suggestions', t => {
	const {mockClient, mockCommandRegistry, mockSessionManager, mockInputHistory} = t.context as Context;
	const presenter = new HomePresenter(
		mockClient,
		mockCommandRegistry,
		mockSessionManager,
		{},
		mockInputHistory
	);

	// Setup suggestions
	mockCommandRegistry.filter.returns([{cmd: '/a'}, {cmd: '/b'}, {cmd: '/c'}]);
	presenter.handleInputChange('/');
	
	t.is(presenter.selectedSuggestionIndex, 0);
	
	presenter.handleSuggestionNavigate('down');
	t.is(presenter.selectedSuggestionIndex, 1);
	
	presenter.handleSuggestionNavigate('down');
	t.is(presenter.selectedSuggestionIndex, 2);
	
	presenter.handleSuggestionNavigate('down');
	t.is(presenter.selectedSuggestionIndex, 0); // Loop back
	
	presenter.handleSuggestionNavigate('up');
	t.is(presenter.selectedSuggestionIndex, 2); // Loop back
});

test.serial('handleSuggestionSelect selects suggestion', t => {
	const {mockClient, mockCommandRegistry, mockSessionManager, mockInputHistory} = t.context as Context;
	const presenter = new HomePresenter(
		mockClient,
		mockCommandRegistry,
		mockSessionManager,
		{},
		mockInputHistory
	);

	mockCommandRegistry.filter.returns([{cmd: '/help'}]);
	presenter.handleInputChange('/h');
	
	const result = presenter.handleSuggestionSelect();
	
	t.is(result, '/help');
	t.is(presenter.input, '/help ');
	t.is(presenter.filteredSuggestions.length, 0);
});

test.serial('cleanup saves session', async t => {
	const {mockClient, mockCommandRegistry, mockSessionManager, mockInputHistory} = t.context as Context;
	const presenter = new HomePresenter(
		mockClient,
		mockCommandRegistry,
		mockSessionManager,
		{},
		mockInputHistory
	);

	// Add a message so session is not empty
	presenter.session.addMessage(Message.user('test'));

	await presenter.cleanup();
	
	t.true(mockSessionManager.saveWithTimestamp.called);
});
