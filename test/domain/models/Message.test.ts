/**
 * Unit tests for Message domain model
 */

import test from 'ava';
import {Message} from '../../../source/core/domain/models/Message.js';

// === Factory Methods Tests ===

test('Message.user() creates user message with correct role', t => {
	const message = Message.user('Hello');

	t.is(message.role, 'user');
	t.is(message.content, 'Hello');
	t.truthy(message.id);
	t.truthy(message.timestamp);
});

test('Message.assistant() creates assistant message with correct role', t => {
	const message = Message.assistant('Hi there');

	t.is(message.role, 'assistant');
	t.is(message.content, 'Hi there');
	t.truthy(message.id);
	t.truthy(message.timestamp);
});

test('Message.system() creates system message with correct role', t => {
	const message = Message.system('System message');

	t.is(message.role, 'system');
	t.is(message.content, 'System message');
});

test('Message.error() creates error message from Error object', t => {
	const error = new Error('Something went wrong');
	const message = Message.error(error);

	t.is(message.role, 'error');
	t.is(message.content, 'Something went wrong');
});

test('Message.error() creates error message from string', t => {
	const message = Message.error('Error text');

	t.is(message.role, 'error');
	t.is(message.content, 'Error text');
});

// === ID Generation Tests ===

test('Message IDs are unique', t => {
	const msg1 = Message.user('Test 1');
	const msg2 = Message.user('Test 2');

	t.not(msg1.id, msg2.id);
	t.regex(msg1.id, /^msg_\d+_[a-z0-9]+$/);
	t.regex(msg2.id, /^msg_\d+_[a-z0-9]+$/);
});

// === Tool Calls Tests ===

test('Message.assistant() can include tool calls', t => {
	const toolCalls = [
		{id: 'call_1', name: 'search', arguments: {query: 'test'}},
	];
	const message = Message.assistant('Result', toolCalls);

	t.deepEqual(message.toolCalls, toolCalls);
	t.true(message.hasToolCalls());
});

test('hasToolCalls() returns false when no tool calls', t => {
	const message = Message.user('Test');

	t.false(message.hasToolCalls());
});

test('hasToolCalls() returns false when tool calls is empty array', t => {
	const message = Message.assistant('Test', []);

	t.false(message.hasToolCalls());
});

// === Role Checker Methods Tests ===

test('isUser() returns true for user messages', t => {
	const message = Message.user('Test');

	t.true(message.isUser());
	t.false(message.isAssistant());
	t.false(message.isSystem());
});

test('isAssistant() returns true for assistant messages', t => {
	const message = Message.assistant('Test');

	t.true(message.isAssistant());
	t.false(message.isUser());
	t.false(message.isSystem());
});

test('isSystem() returns true for system messages', t => {
	const message = Message.system('Test');

	t.true(message.isSystem());
	t.false(message.isUser());
	t.false(message.isAssistant());
});

// === Metadata Tests ===

test('Message.create() can include metadata', t => {
	const metadata = {tokens: 100, model: 'gpt-4'};
	const message = Message.create('user', 'Test', {metadata});

	t.deepEqual(message.metadata, metadata);
});

test('Message without metadata has undefined metadata', t => {
	const message = Message.user('Test');

	t.is(message.metadata, undefined);
});

// === Timestamp Tests ===

test('Message timestamp is set to current time', t => {
	const before = new Date();
	const message = Message.user('Test');
	const after = new Date();

	t.true(message.timestamp >= before);
	t.true(message.timestamp <= after);
});

// === toJSON Tests ===

test('toJSON() returns serializable object', t => {
	const message = Message.user('Test');
	const json = message.toJSON();

	t.is(typeof json, 'object');
	t.is(json.id, message.id);
	t.is(json.role, 'user');
	t.is(json.content, 'Test');
	t.is(json.timestamp, message.timestamp.toISOString());
});

test('toJSON() includes tool calls if present', t => {
	const toolCalls = [{id: 'call_1', name: 'test', arguments: {}}];
	const message = Message.assistant('Test', toolCalls);
	const json = message.toJSON();

	t.deepEqual(json.toolCalls, toolCalls);
});

test('toJSON() includes metadata if present', t => {
	const metadata = {key: 'value'};
	const message = Message.create('user', 'Test', {metadata});
	const json = message.toJSON();

	t.deepEqual(json.metadata, metadata);
});

// === Immutability Tests ===

test('Message properties are readonly', t => {
	const message = Message.user('Test');

	// TypeScript will prevent this at compile time,
	// but we test runtime behavior
	t.throws(() => {
		// @ts-expect-error - testing immutability
		message.content = 'Modified';
	});
});
