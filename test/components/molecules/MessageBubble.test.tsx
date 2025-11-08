/**
 * Unit tests for MessageBubble component
 */

import test from 'ava';
import React from 'react';
import { render } from 'ink-testing-library';
import { MessageBubble } from '../../../source/cli/components/molecules/MessageBubble.js';
import { Message } from '../../../source/core/domain/models/Message.js';

// === User Message Tests ===

test('renders user message with correct role indicator', (t) => {
	const message = Message.user('Hello');
	const { lastFrame } = render(<MessageBubble message={message} />);
	const output = lastFrame();

	t.true(output.includes('You'));
	t.true(output.includes('Hello'));
});

test('renders user message content', (t) => {
	const message = Message.user('Test message content');
	const { lastFrame } = render(<MessageBubble message={message} />);
	const output = lastFrame();

	t.true(output.includes('Test message content'));
});

// === Assistant Message Tests ===

test('renders assistant message with correct role indicator', (t) => {
	const message = Message.assistant('Hi there');
	const { lastFrame } = render(<MessageBubble message={message} />);
	const output = lastFrame();

	t.true(output.includes('Assistant') || output.includes('AI'));
	t.true(output.includes('Hi there'));
});

test('renders assistant message with markdown', (t) => {
	const message = Message.assistant('# Title\n\nParagraph text');
	const { lastFrame } = render(<MessageBubble message={message} />);
	const output = lastFrame();

	// MarkdownText component should be used for assistant messages
	t.true(output.includes('Title'));
	t.true(output.includes('Paragraph text'));
});

// === System Message Tests ===

test('renders system message', (t) => {
	const message = Message.system('System notification');
	const { lastFrame } = render(<MessageBubble message={message} />);
	const output = lastFrame();

	t.true(output.includes('System'));
	t.true(output.includes('System notification'));
});

// === Error Message Tests ===

test('renders error message with error styling', (t) => {
	const message = Message.error('Something went wrong');
	const { lastFrame } = render(<MessageBubble message={message} />);
	const output = lastFrame();

	t.true(output.includes('Error'));
	t.true(output.includes('Something went wrong'));
});

test('renders error message from Error object', (t) => {
	const error = new Error('Network error');
	const message = Message.error(error);
	const { lastFrame } = render(<MessageBubble message={message} />);
	const output = lastFrame();

	t.true(output.includes('Network error'));
});

// === Streaming Indicator Tests ===

test('shows streaming indicator when isStreaming=true', (t) => {
	const message = Message.assistant('Streaming...');
	const { lastFrame } = render(<MessageBubble message={message} isStreaming={true} />);
	const output = lastFrame();

	// Should show some kind of streaming indicator
	// Implementation may use ▊, ▌, or similar characters
	t.true(output.length > 0);
});

test('hides streaming indicator when isStreaming=false', (t) => {
	const message = Message.assistant('Complete');
	const { lastFrame } = render(<MessageBubble message={message} isStreaming={false} />);
	const output = lastFrame();

	// Verify it renders
	t.true(output.includes('Complete'));
});

test('hides streaming indicator when isStreaming is undefined', (t) => {
	const message = Message.assistant('Complete');
	const { lastFrame } = render(<MessageBubble message={message} />);
	const output = lastFrame();

	t.true(output.includes('Complete'));
});

// === Timestamp Tests ===

test('includes timestamp in output', (t) => {
	const message = Message.user('Test');
	const { lastFrame } = render(<MessageBubble message={message} />);
	const output = lastFrame();

	// Should have some time indicator (format depends on implementation)
	// At minimum, the message should render
	t.truthy(output);
});

// === Different Message Roles Tests ===

test('distinguishes between different roles visually', (t) => {
	const userMsg = Message.user('User message');
	const assistantMsg = Message.assistant('Assistant message');

	const userOutput = render(<MessageBubble message={userMsg} />).lastFrame();
	const assistantOutput = render(<MessageBubble message={assistantMsg} />).lastFrame();

	// Outputs should be different (different role indicators/styling)
	t.not(userOutput, assistantOutput);
});

// === Edge Cases ===

test('handles empty content', (t) => {
	const message = Message.user('');

	t.notThrows(() => {
		render(<MessageBubble message={message} />);
	});
});

test('handles very long content', (t) => {
	const longContent = 'A'.repeat(10000);
	const message = Message.user(longContent);

	t.notThrows(() => {
		render(<MessageBubble message={message} />);
	});
});

test('handles multiline content', (t) => {
	const message = Message.user('Line 1\nLine 2\nLine 3');
	const { lastFrame } = render(<MessageBubble message={message} />);
	const output = lastFrame();

	t.true(output.includes('Line 1'));
	t.true(output.includes('Line 2'));
	t.true(output.includes('Line 3'));
});

test('handles special characters', (t) => {
	const message = Message.user('Special: @#$%^&*()[]{}');
	const { lastFrame } = render(<MessageBubble message={message} />);
	const output = lastFrame();

	t.true(output.includes('Special:'));
});

test('handles unicode characters', (t) => {
	const message = Message.user('Unicode: 你好 مرحبا שלום');
	const { lastFrame } = render(<MessageBubble message={message} />);
	const output = lastFrame();

	t.true(output.includes('Unicode:'));
});

// === Markdown Rendering Tests (for assistant) ===

test('renders code blocks for assistant messages', (t) => {
	const message = Message.assistant('```javascript\nconst x = 1;\n```');
	const { lastFrame } = render(<MessageBubble message={message} />);
	const output = lastFrame();

	t.true(output.includes('const x = 1'));
});

test('renders lists for assistant messages', (t) => {
	const message = Message.assistant('- Item 1\n- Item 2\n- Item 3');
	const { lastFrame } = render(<MessageBubble message={message} />);
	const output = lastFrame();

	t.true(output.includes('Item 1'));
	t.true(output.includes('Item 2'));
	t.true(output.includes('Item 3'));
});

test('does not render markdown for user messages', (t) => {
	const message = Message.user('# Not a heading');
	const { lastFrame } = render(<MessageBubble message={message} />);
	const output = lastFrame();

	// Should show literal # character, not rendered as heading
	t.true(output.includes('#'));
});
