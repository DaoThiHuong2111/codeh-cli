/**
 * Unit tests for MessageBubble component
 * Tests error boundary integration and sanitized markdown flow
 * Requirements: All (markdown-rendering-improvements)
 */

import React from 'react';
import test from 'ava';
import {render} from 'ink-testing-library';
import {MessageBubble} from '../../../../dist/cli/components/molecules/MessageBubble.js';
import {Message} from '../../../../dist/core/domain/models/Message.js';

// === User Message Tests ===

test('renders user message with correct role indicator', t => {
	const message = Message.user('Hello');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('You'));
	t.true(output.includes('Hello'));
});

test('renders user message content', t => {
	const message = Message.user('Test message content');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('Test message content'));
});

// === Assistant Message Tests ===

test('renders assistant message with correct role indicator', t => {
	const message = Message.assistant('Hi there');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('Assistant') || output.includes('AI'));
	t.true(output.includes('Hi there'));
});

test('renders assistant message with markdown', t => {
	const message = Message.assistant('# Title\n\nParagraph text');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('Title'));
	t.true(output.includes('Paragraph text'));
});

// === System Message Tests ===

test('renders system message', t => {
	const message = Message.system('System notification');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('System'));
	t.true(output.includes('System notification'));
});

// === Error Message Tests ===

test('renders error message with error styling', t => {
	const message = Message.error('Something went wrong');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('Error'));
	t.true(output.includes('Something went wrong'));
});

test('renders error message from Error object', t => {
	const error = new Error('Network error');
	const message = Message.error(error);
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('Network error'));
});

// === Streaming Indicator Tests ===

test('shows streaming indicator when isStreaming=true', t => {
	const message = Message.assistant('Streaming...');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message, isStreaming: true})
	);
	const output = lastFrame() || '';

	t.true(output.length > 0);
});

test('hides streaming indicator when isStreaming=false', t => {
	const message = Message.assistant('Complete');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message, isStreaming: false})
	);
	const output = lastFrame() || '';

	t.true(output.includes('Complete'));
});

// === Edge Cases ===

test('handles empty content', t => {
	const message = Message.user('');

	t.notThrows(() => {
		render(React.createElement(MessageBubble, {message}));
	});
});

test('handles very long content', t => {
	const longContent = 'A'.repeat(10000);
	const message = Message.user(longContent);

	t.notThrows(() => {
		render(React.createElement(MessageBubble, {message}));
	});
});

test('handles multiline content', t => {
	const message = Message.user('Line 1\nLine 2\nLine 3');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('Line 1'));
	t.true(output.includes('Line 2'));
	t.true(output.includes('Line 3'));
});

test('handles special characters', t => {
	const message = Message.user('Special: @#$%^&*()[]{}');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('Special:'));
});

test('handles unicode characters', t => {
	const message = Message.user('Unicode: 你好 مرحبا שלום');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('Unicode:'));
});

// === Markdown Rendering Tests (for assistant) ===

test('renders code blocks for assistant messages', t => {
	const message = Message.assistant('```javascript\nconst x = 1;\n```');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('const x = 1'));
});

test('renders lists for assistant messages', t => {
	const message = Message.assistant('- Item 1\n- Item 2\n- Item 3');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('Item 1'));
	t.true(output.includes('Item 2'));
	t.true(output.includes('Item 3'));
});

test('does not render markdown for user messages', t => {
	const message = Message.user('# Not a heading');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('#'));
});

// === Error Boundary and Sanitization Tests ===

test('handles markdown rendering errors gracefully', t => {
	const message = Message.assistant('```\nunclosed code block');
	
	t.notThrows(() => {
		render(React.createElement(MessageBubble, {message}));
	});
});

test('renders HTML-containing content after sanitization', t => {
	const message = Message.assistant('<div>HTML content</div> and **bold** text');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('HTML content'));
	t.true(output.includes('bold'));
	t.false(output.includes('<div>'));
	t.false(output.includes('</div>'));
});

test('renders tables in assistant messages', t => {
	const tableMarkdown = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;
	const message = Message.assistant(tableMarkdown);
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('Header 1'));
	t.true(output.includes('Header 2'));
	t.true(output.includes('Cell 1'));
	t.true(output.includes('Cell 2'));
});

test('renders horizontal rules in assistant messages', t => {
	const message = Message.assistant('Before\n\n---\n\nAfter');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('Before'));
	t.true(output.includes('After'));
	t.true(output.includes('─'));
});

test('renders links in assistant messages', t => {
	const message = Message.assistant('Check out [this link](https://example.com)');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('this link'));
	t.true(output.includes('example.com'));
});

test('handles HTML entities in assistant messages', t => {
	const message = Message.assistant('Less than: &lt; Greater than: &gt;');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	// Check that the decoded characters appear in the output
	t.true(output.includes('Less than:'));
	t.true(output.includes('Greater than:'));
	// HTML entities should be decoded - check for the actual < character
	// The output should contain "Less than: <" (decoded from &lt;)
	t.true(output.includes('Less than: <'));
	t.true(output.includes('Greater than: >'));
});

test('handles escaped markdown characters', t => {
	const message = Message.assistant('Not bold: \\*text\\*');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('*text*'));
});

test('handles nested formatting in assistant messages', t => {
	const message = Message.assistant('***bold and italic***');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('bold and italic'));
});

test('handles blockquotes with nested elements', t => {
	const message = Message.assistant('> Quote with **bold** text');
	const {lastFrame} = render(
		React.createElement(MessageBubble, {message})
	);
	const output = lastFrame() || '';

	t.true(output.includes('Quote with'));
});

test('handles unclosed formatting markers gracefully', t => {
	const message = Message.assistant('Unclosed **bold text');
	
	t.notThrows(() => {
		const {lastFrame} = render(
			React.createElement(MessageBubble, {message})
		);
		const output = lastFrame() || '';
		t.true(output.includes('Unclosed'));
	});
});

test('handles empty code blocks gracefully', t => {
	const message = Message.assistant('Before\n```\n```\nAfter');
	
	t.notThrows(() => {
		const {lastFrame} = render(
			React.createElement(MessageBubble, {message})
		);
		const output = lastFrame() || '';
		t.true(output.includes('Before'));
		t.true(output.includes('After'));
	});
});
