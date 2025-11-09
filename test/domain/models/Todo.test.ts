/**
 * Unit tests for Todo domain model
 */

import test from 'ava';
import {Todo} from '../../../source/core/domain/models/Todo.js';

// === Factory Methods Tests ===

test('Todo.create() creates todo with default pending status', t => {
	const todo = Todo.create('Write tests');

	t.is(todo.content, 'Write tests');
	t.is(todo.status, 'pending');
	t.truthy(todo.id);
	t.truthy(todo.timestamp);
});

test('Todo.create() can specify initial status', t => {
	const todo = Todo.create('In progress task', {status: 'in_progress'});

	t.is(todo.status, 'in_progress');
});

test('Todo.pending() creates pending todo', t => {
	const todo = Todo.pending('Pending task');

	t.is(todo.status, 'pending');
	t.is(todo.content, 'Pending task');
});

test('Todo.inProgress() creates in_progress todo', t => {
	const todo = Todo.inProgress('Active task');

	t.is(todo.status, 'in_progress');
	t.is(todo.content, 'Active task');
});

test('Todo.completed() creates completed todo', t => {
	const todo = Todo.completed('Done task');

	t.is(todo.status, 'completed');
	t.is(todo.content, 'Done task');
});

// === ID Generation Tests ===

test('Todo IDs are unique', t => {
	const todo1 = Todo.create('Task 1');
	const todo2 = Todo.create('Task 2');

	t.not(todo1.id, todo2.id);
	t.regex(todo1.id, /^todo_\d+_[a-z0-9]+$/);
	t.regex(todo2.id, /^todo_\d+_[a-z0-9]+$/);
});

// === Status Checker Methods Tests ===

test('isPending() returns true for pending todos', t => {
	const todo = Todo.pending('Task');

	t.true(todo.isPending());
	t.false(todo.isInProgress());
	t.false(todo.isCompleted());
});

test('isInProgress() returns true for in_progress todos', t => {
	const todo = Todo.inProgress('Task');

	t.true(todo.isInProgress());
	t.false(todo.isPending());
	t.false(todo.isCompleted());
});

test('isCompleted() returns true for completed todos', t => {
	const todo = Todo.completed('Task');

	t.true(todo.isCompleted());
	t.false(todo.isPending());
	t.false(todo.isInProgress());
});

// === Immutability Tests ===

test('withStatus() creates new todo with updated status', t => {
	const todo = Todo.pending('Task');
	const updated = todo.withStatus('in_progress');

	// Original unchanged
	t.is(todo.status, 'pending');

	// New todo has new status but same ID and content
	t.is(updated.status, 'in_progress');
	t.is(updated.id, todo.id);
	t.is(updated.content, todo.content);
	t.is(updated.timestamp, todo.timestamp);
});

test('complete() creates new todo with completed status', t => {
	const todo = Todo.pending('Task');
	const completed = todo.complete();

	t.is(todo.status, 'pending');
	t.is(completed.status, 'completed');
	t.is(completed.id, todo.id);
});

test('start() creates new todo with in_progress status', t => {
	const todo = Todo.pending('Task');
	const started = todo.start();

	t.is(todo.status, 'pending');
	t.is(started.status, 'in_progress');
	t.is(started.id, todo.id);
});

// === Metadata Tests ===

test('Todo.create() can include metadata', t => {
	const metadata = {priority: 'high', tags: ['urgent']};
	const todo = Todo.create('Important task', {metadata});

	t.deepEqual(todo.metadata, metadata);
});

test('Todo without metadata has undefined metadata', t => {
	const todo = Todo.create('Task');

	t.is(todo.metadata, undefined);
});

test('withStatus() preserves metadata', t => {
	const metadata = {key: 'value'};
	const todo = Todo.create('Task', {metadata});
	const updated = todo.withStatus('completed');

	t.deepEqual(updated.metadata, metadata);
});

// === Timestamp Tests ===

test('Todo timestamp is set to current time', t => {
	const before = new Date();
	const todo = Todo.create('Task');
	const after = new Date();

	t.true(todo.timestamp >= before);
	t.true(todo.timestamp <= after);
});

// === toJSON Tests ===

test('toJSON() returns serializable object', t => {
	const todo = Todo.create('Task');
	const json = todo.toJSON();

	t.is(typeof json, 'object');
	t.is(json.id, todo.id);
	t.is(json.content, 'Task');
	t.is(json.status, 'pending');
	t.is(json.timestamp, todo.timestamp.toISOString());
});

test('toJSON() includes metadata if present', t => {
	const metadata = {key: 'value'};
	const todo = Todo.create('Task', {metadata});
	const json = todo.toJSON();

	t.deepEqual(json.metadata, metadata);
});

// === Status Transitions Tests ===

test('Can transition from pending to in_progress to completed', t => {
	const todo = Todo.pending('Task');
	const started = todo.start();
	const completed = started.complete();

	t.is(todo.status, 'pending');
	t.is(started.status, 'in_progress');
	t.is(completed.status, 'completed');

	// All have same ID
	t.is(started.id, todo.id);
	t.is(completed.id, todo.id);
});

test('Can complete a todo directly from pending', t => {
	const todo = Todo.pending('Quick task');
	const completed = todo.complete();

	t.is(completed.status, 'completed');
	t.is(completed.id, todo.id);
});
