/**
 * Tests for TodosDisplay Component
 * Coverage target: 95%
 */

import React from 'react';
import test from 'ava';
import {render} from 'ink-testing-library';
import {TodosDisplay} from '../../../../dist/cli/components/organisms/TodosDisplay.js';
import {Todo} from '../../../../dist/core/domain/models/Todo.js';

test('renders todos grouped by status', t => {
	const todos = [
		Todo.pending('Task 1'),
		Todo.inProgress('Task 2'),
		Todo.completed('Task 3')
	];

	const {lastFrame} = render(
		<TodosDisplay todos={todos} />
	);

	t.true(lastFrame()?.includes('Task 1'));
	t.true(lastFrame()?.includes('Task 2'));
	t.true(lastFrame()?.includes('Task 3'));
	t.true(lastFrame()?.includes('Pending'));
	t.true(lastFrame()?.includes('In Progress'));
	t.true(lastFrame()?.includes('Completed'));
});

test('renders progress bar', t => {
	const todos = [
		Todo.completed('Task 1'),
		Todo.pending('Task 2')
	];

	const {lastFrame} = render(
		<TodosDisplay todos={todos} showProgress={true} />
	);

	// Progress bar usually renders as blocks.
	// I can check for percentage text.
	// 1/2 = 50%
	t.true(lastFrame()?.includes('50%'));
});

test('renders nothing when empty', t => {
	const {lastFrame} = render(
		<TodosDisplay todos={[]} />
	);
	t.is(lastFrame(), '');
});
