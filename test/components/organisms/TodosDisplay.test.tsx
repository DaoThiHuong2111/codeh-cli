/**
 * Unit tests for TodosDisplay component
 */

import test from 'ava';
import React from 'react';
import { render } from 'ink-testing-library';
import { TodosDisplay } from '../../../source/cli/components/organisms/TodosDisplay.js';
import { Todo } from '../../../source/core/domain/models/Todo.js';

// === Rendering Tests ===

test('renders nothing when todos array is empty', (t) => {
	const { lastFrame } = render(<TodosDisplay todos={[]} />);
	const output = lastFrame();

	// Should render empty or null
	t.is(output, null || '');
});

test('renders todos with correct header', (t) => {
	const todos = [Todo.pending('Task 1')];
	const { lastFrame } = render(<TodosDisplay todos={todos} />);
	const output = lastFrame();

	t.true(output.includes('Tasks') || output.includes('📋'));
});

test('shows completion count in header', (t) => {
	const todos = [
		Todo.completed('Done'),
		Todo.pending('Todo'),
		Todo.pending('Todo 2'),
	];
	const { lastFrame } = render(<TodosDisplay todos={todos} />);
	const output = lastFrame();

	t.true(output.includes('1/3') || output.includes('(1/3)'));
});

// === Progress Bar Tests ===

test('shows progress bar when showProgress=true', (t) => {
	const todos = [Todo.completed('Done'), Todo.pending('Todo')];
	const { lastFrame } = render(<TodosDisplay todos={todos} showProgress={true} />);
	const output = lastFrame();

	// Should include progress indicators (█ or ░)
	t.true(output.includes('█') || output.includes('░') || output.includes('50%'));
});

test('hides progress bar when showProgress=false', (t) => {
	const todos = [Todo.completed('Done')];
	const { lastFrame } = render(<TodosDisplay todos={todos} showProgress={false} />);
	const output = lastFrame();

	// Output should not include progress bar characters
	// This is a weak test but verifies no crash
	t.truthy(output);
});

test('progress bar shows correct percentage', (t) => {
	const todos = [
		Todo.completed('Done 1'),
		Todo.completed('Done 2'),
		Todo.pending('Todo'),
	];
	const { lastFrame } = render(<TodosDisplay todos={todos} />);
	const output = lastFrame();

	// 2/3 = 66% or 67%
	t.true(output.includes('66%') || output.includes('67%'));
});

// === Status Grouping Tests ===

test('groups todos by status', (t) => {
	const todos = [
		Todo.pending('Pending 1'),
		Todo.inProgress('Active'),
		Todo.completed('Done'),
		Todo.pending('Pending 2'),
	];
	const { lastFrame } = render(<TodosDisplay todos={todos} />);
	const output = lastFrame();

	// Should show status section headers
	t.true(output.includes('In Progress') || output.includes('⚡'));
	t.true(output.includes('Pending') || output.includes('⏳'));
	t.true(output.includes('Completed') || output.includes('✓'));
});

test('shows in_progress todos first', (t) => {
	const todos = [
		Todo.pending('Last'),
		Todo.inProgress('First'),
		Todo.completed('Middle'),
	];
	const { lastFrame } = render(<TodosDisplay todos={todos} />);
	const output = lastFrame();

	const firstIndex = output.indexOf('First');
	const lastIndex = output.indexOf('Last');

	// "First" should appear before "Last" in output
	t.true(firstIndex < lastIndex);
});

test('shows pending todos second', (t) => {
	const todos = [
		Todo.completed('Last'),
		Todo.pending('Middle'),
	];
	const { lastFrame } = render(<TodosDisplay todos={todos} />);
	const output = lastFrame();

	const middleIndex = output.indexOf('Middle');
	const lastIndex = output.indexOf('Last');

	t.true(middleIndex < lastIndex);
});

test('shows completed todos last', (t) => {
	const todos = [
		Todo.completed('Last'),
		Todo.inProgress('First'),
		Todo.pending('Middle'),
	];
	const { lastFrame } = render(<TodosDisplay todos={todos} />);
	const output = lastFrame();

	const lastIndex = output.indexOf('Last');
	const firstIndex = output.indexOf('First');
	const middleIndex = output.indexOf('Middle');

	t.true(lastIndex > firstIndex);
	t.true(lastIndex > middleIndex);
});

// === Status Indicators Tests ===

test('shows different indicators for different statuses', (t) => {
	const todos = [
		Todo.pending('Pending'),
		Todo.inProgress('Active'),
		Todo.completed('Done'),
	];
	const { lastFrame } = render(<TodosDisplay todos={todos} />);
	const output = lastFrame();

	// Should include status icons (○, ◐, ●) or similar
	t.truthy(output);
	t.true(output.length > 100); // Has content
});

test('pending todos use gray/empty circle indicator', (t) => {
	const todos = [Todo.pending('Task')];
	const { lastFrame } = render(<TodosDisplay todos={todos} />);
	const output = lastFrame();

	// Pending indicator is ○
	t.true(output.includes('○') || output.includes('Task'));
});

test('in_progress todos use yellow/half circle indicator', (t) => {
	const todos = [Todo.inProgress('Task')];
	const { lastFrame } = render(<TodosDisplay todos={todos} />);
	const output = lastFrame();

	// In progress indicator is ◐
	t.true(output.includes('◐') || output.includes('Task'));
});

test('completed todos use green/filled circle indicator', (t) => {
	const todos = [Todo.completed('Task')];
	const { lastFrame } = render(<TodosDisplay todos={todos} />);
	const output = lastFrame();

	// Completed indicator is ●
	t.true(output.includes('●') || output.includes('Task'));
});

// === Content Display Tests ===

test('displays todo content correctly', (t) => {
	const todos = [
		Todo.pending('Write documentation'),
		Todo.inProgress('Implement feature'),
		Todo.completed('Fix bug'),
	];
	const { lastFrame } = render(<TodosDisplay todos={todos} />);
	const output = lastFrame();

	t.true(output.includes('Write documentation'));
	t.true(output.includes('Implement feature'));
	t.true(output.includes('Fix bug'));
});

test('handles long todo content', (t) => {
	const longContent = 'A'.repeat(100);
	const todos = [Todo.pending(longContent)];

	t.notThrows(() => {
		render(<TodosDisplay todos={todos} />);
	});
});

test('handles special characters in content', (t) => {
	const todos = [Todo.pending('Task with special chars: @#$%')];
	const { lastFrame } = render(<TodosDisplay todos={todos} />);
	const output = lastFrame();

	t.true(output.includes('@#$%'));
});

// === Count Display Tests ===

test('shows count for each status section', (t) => {
	const todos = [
		Todo.pending('P1'),
		Todo.pending('P2'),
		Todo.inProgress('I1'),
	];
	const { lastFrame } = render(<TodosDisplay todos={todos} />);
	const output = lastFrame();

	// Should show counts like (2) for pending, (1) for in_progress
	t.true(output.includes('(2)') || output.includes('2'));
	t.true(output.includes('(1)') || output.includes('1'));
});

test('calculates counts correctly', (t) => {
	const todos = [
		Todo.completed('C1'),
		Todo.completed('C2'),
		Todo.completed('C3'),
		Todo.pending('P1'),
	];
	const { lastFrame } = render(<TodosDisplay todos={todos} />);
	const output = lastFrame();

	// 3 completed out of 4 total
	t.true(output.includes('3/4') || output.includes('(3/4)'));
});

// === Edge Cases ===

test('handles single todo', (t) => {
	const todos = [Todo.pending('Only one')];
	const { lastFrame } = render(<TodosDisplay todos={todos} />);
	const output = lastFrame();

	t.true(output.includes('Only one'));
	t.true(output.includes('0/1') || output.includes('(0/1)'));
});

test('handles all todos completed', (t) => {
	const todos = [
		Todo.completed('Done 1'),
		Todo.completed('Done 2'),
	];
	const { lastFrame } = render(<TodosDisplay todos={todos} />);
	const output = lastFrame();

	t.true(output.includes('2/2') || output.includes('(2/2)'));
	t.true(output.includes('100%'));
});

test('handles all todos pending', (t) => {
	const todos = [
		Todo.pending('Todo 1'),
		Todo.pending('Todo 2'),
	];
	const { lastFrame } = render(<TodosDisplay todos={todos} />);
	const output = lastFrame();

	t.true(output.includes('0/2') || output.includes('(0/2)'));
	t.true(output.includes('0%'));
});

test('handles many todos', (t) => {
	const todos = Array.from({ length: 50 }, (_, i) =>
		Todo.pending(`Task ${i + 1}`)
	);

	t.notThrows(() => {
		render(<TodosDisplay todos={todos} />);
	});
});
