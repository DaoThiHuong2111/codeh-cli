/**
 * Tests for CodehChat
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {CodehChat} from '../../../dist/core/application/CodehChat.js';
import {Message} from '../../../dist/core/domain/models/Message.js';
import {Session} from '../../../dist/core/domain/models/Session.js';

// ===========================
// Test Setup & Helpers
// ===========================

const mockHistoryRepo = {
	addMessage: sinon.stub().resolves(),
	getMessages: sinon.stub().resolves([]),
	clear: sinon.stub().resolves(),
	getConversationId: sinon.stub().returns('test-id'),
	setConversationId: sinon.stub(),
	load: sinon.stub().resolves(null),
	saveHistory: sinon.stub().resolves(),
	startNewConversation: sinon.stub().resolves(),
};

test.afterEach(() => {
	sinon.restore();
	mockHistoryRepo.addMessage.reset();
	mockHistoryRepo.clear.reset();
	mockHistoryRepo.startNewConversation.reset();
	mockHistoryRepo.load.reset();
});

// ===========================
// Initialization Tests
// ===========================

test.serial('initializes with empty session', (t) => {
	const chat = new CodehChat(mockHistoryRepo as any);
	const session = chat.getSession();
	
	t.truthy(session);
	t.is(session.getMessageCount(), 0);
});

// ===========================
// Message Handling Tests
// ===========================

test.serial('sendMessage adds user message and saves to history', async (t) => {
	const chat = new CodehChat(mockHistoryRepo as any);
	const msg = await chat.sendMessage('Hello');
	
	t.is(msg.role, 'user');
	t.is(msg.content, 'Hello');
	t.is(chat.getSession().getMessageCount(), 1);
	t.true(mockHistoryRepo.addMessage.calledOnce);
	t.deepEqual(mockHistoryRepo.addMessage.firstCall.args[0], msg);
});

test.serial('addResponse adds assistant message and saves to history', async (t) => {
	const chat = new CodehChat(mockHistoryRepo as any);
	const msg = await chat.addResponse('Hi there');
	
	t.is(msg.role, 'assistant');
	t.is(msg.content, 'Hi there');
	t.is(chat.getSession().getMessageCount(), 1);
	t.true(mockHistoryRepo.addMessage.calledOnce);
	t.deepEqual(mockHistoryRepo.addMessage.firstCall.args[0], msg);
});

// ===========================
// Session Management Tests
// ===========================

test.serial('clear resets session and history', async (t) => {
	const chat = new CodehChat(mockHistoryRepo as any);
	await chat.sendMessage('test');
	
	await chat.clear();
	
	t.is(chat.getSession().getMessageCount(), 0);
	t.true(mockHistoryRepo.clear.calledOnce);
});

test.serial('startNew creates new session', async (t) => {
	const chat = new CodehChat(mockHistoryRepo as any);
	await chat.sendMessage('old message');
	const oldSessionId = chat.getSession().id;
	
	await chat.startNew();
	
	const newSession = chat.getSession();
	t.not(newSession.id, oldSessionId);
	t.is(newSession.getMessageCount(), 0);
	t.true(mockHistoryRepo.startNewConversation.calledOnce);
});

test.serial('loadFromHistory restores session', async (t) => {
	const historyData = {
		id: 'restored-id',
		messages: [
			{role: 'user', content: 'Hello', timestamp: Date.now()},
			{role: 'assistant', content: 'Hi', timestamp: Date.now()}
		]
	};
	mockHistoryRepo.load.resolves(historyData);
	
	const chat = new CodehChat(mockHistoryRepo as any);
	await chat.loadFromHistory('restored-id');
	
	const session = chat.getSession();
	t.is(session.id, 'restored-id');
	t.is(session.getMessageCount(), 2);
	t.is(session.getMessages()[0].content, 'Hello');
	t.is(session.getMessages()[1].content, 'Hi');
});

test.serial('loadFromHistory does nothing if history not found', async (t) => {
	mockHistoryRepo.load.resolves(null);
	
	const chat = new CodehChat(mockHistoryRepo as any);
	const initialId = chat.getSession().id;
	
	await chat.loadFromHistory('missing-id');
	
	t.is(chat.getSession().id, initialId);
});

// ===========================
// Stats & Getters Tests
// ===========================

test.serial('getStats returns correct statistics', async (t) => {
	const chat = new CodehChat(mockHistoryRepo as any);
	await chat.sendMessage('User 1');
	await chat.addResponse('Assistant 1');
	await chat.sendMessage('User 2');
	
	const stats = chat.getStats();
	
	t.is(stats.messageCount, 3);
	t.is(stats.userMessages, 2);
	t.is(stats.assistantMessages, 1);
	t.true(stats.estimatedTokens > 0);
});

test.serial('getHistory returns all messages', async (t) => {
	const chat = new CodehChat(mockHistoryRepo as any);
	await chat.sendMessage('1');
	await chat.addResponse('2');
	
	const history = chat.getHistory();
	t.is(history.length, 2);
});

test.serial('getLastMessages returns N messages', async (t) => {
	const chat = new CodehChat(mockHistoryRepo as any);
	await chat.sendMessage('1');
	await chat.addResponse('2');
	await chat.sendMessage('3');
	
	const last2 = chat.getLastMessages(2);
	t.is(last2.length, 2);
	t.is(last2[0].content, '2');
	t.is(last2[1].content, '3');
});
