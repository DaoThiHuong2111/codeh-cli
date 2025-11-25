/**
 * Unit tests for MarkdownErrorBoundary component
 * Tests error boundary behavior for markdown rendering failures
 * Requirements: 7.5 (Parse error fallback)
 */

import React from 'react';
import test from 'ava';
import {render} from 'ink-testing-library';
import {Text} from 'ink';
import {MarkdownErrorBoundary} from '../../../../dist/cli/components/molecules/MarkdownErrorBoundary.js';

// Component that throws an error for testing
class ThrowingComponent extends React.Component {
	render() {
		throw new Error('Test error');
	}
}

// Component that renders normally
const NormalComponent: React.FC<{text: string}> = ({text}) => {
	return React.createElement(Text, null, text);
};

test('renders children when no error occurs', t => {
	const {lastFrame} = render(
		React.createElement(
			MarkdownErrorBoundary,
			{fallbackContent: 'Fallback'},
			React.createElement(NormalComponent, {text: 'Normal content'})
		)
	);
	const output = lastFrame() || '';

	t.true(output.includes('Normal content'));
	t.false(output.includes('Fallback'));
});

test('renders fallback content when child throws error', t => {
	// Suppress console.error for this test since React logs errors
	const originalError = console.error;
	console.error = () => {};

	const {lastFrame} = render(
		React.createElement(
			MarkdownErrorBoundary,
			{fallbackContent: 'Fallback content here'},
			React.createElement(ThrowingComponent)
		)
	);
	const output = lastFrame() || '';

	console.error = originalError;

	t.true(output.includes('Fallback content here'));
});

test('fallback content preserves the original text', t => {
	const originalError = console.error;
	console.error = () => {};

	const originalContent = 'This is the original markdown content with **bold** and *italic*';
	const {lastFrame} = render(
		React.createElement(
			MarkdownErrorBoundary,
			{fallbackContent: originalContent},
			React.createElement(ThrowingComponent)
		)
	);
	const output = lastFrame() || '';

	console.error = originalError;

	t.true(output.includes(originalContent));
});

test('handles empty fallback content', t => {
	const originalError = console.error;
	console.error = () => {};

	t.notThrows(() => {
		render(
			React.createElement(
				MarkdownErrorBoundary,
				{fallbackContent: ''},
				React.createElement(ThrowingComponent)
			)
		);
	});

	console.error = originalError;
});

test('handles multiline fallback content', t => {
	const originalError = console.error;
	console.error = () => {};

	const multilineContent = 'Line 1\nLine 2\nLine 3';
	const {lastFrame} = render(
		React.createElement(
			MarkdownErrorBoundary,
			{fallbackContent: multilineContent},
			React.createElement(ThrowingComponent)
		)
	);
	const output = lastFrame() || '';

	console.error = originalError;

	t.true(output.includes('Line 1'));
	t.true(output.includes('Line 2'));
	t.true(output.includes('Line 3'));
});
