/**
 * Tests for MarkdownText Component and its sub-components
 * Tests TableBlock, HorizontalRule, and Link components
 * Requirements: 2.2, 4.2, 5.2
 */

import React from 'react';
import test from 'ava';
import {render} from 'ink-testing-library';
import {
	MarkdownText,
	TableBlock,
	HorizontalRule,
	Link,
} from '../../../../dist/cli/components/molecules/MarkdownText.js';

// ============================================
// TableBlock Component Tests (Requirement 2.2)
// ============================================

test('TableBlock renders headers correctly', t => {
	const {lastFrame} = render(
		React.createElement(TableBlock, {
			headers: ['Name', 'Age', 'City'],
			rows: [['Alice', '30', 'NYC']],
		})
	);
	const output = lastFrame() || '';
	t.true(output.includes('Name'));
	t.true(output.includes('Age'));
	t.true(output.includes('City'));
});

test('TableBlock renders data rows correctly', t => {
	const {lastFrame} = render(
		React.createElement(TableBlock, {
			headers: ['Name', 'Value'],
			rows: [
				['Item1', '100'],
				['Item2', '200'],
			],
		})
	);
	const output = lastFrame() || '';
	t.true(output.includes('Item1'));
	t.true(output.includes('100'));
	t.true(output.includes('Item2'));
	t.true(output.includes('200'));
});

test('TableBlock renders borders', t => {
	const {lastFrame} = render(
		React.createElement(TableBlock, {
			headers: ['A', 'B'],
			rows: [['1', '2']],
		})
	);
	const output = lastFrame() || '';
	// Check for box-drawing characters
	t.true(output.includes('┌'));
	t.true(output.includes('┐'));
	t.true(output.includes('└'));
	t.true(output.includes('┘'));
	t.true(output.includes('│'));
	t.true(output.includes('─'));
});

test('TableBlock handles empty rows', t => {
	const {lastFrame} = render(
		React.createElement(TableBlock, {
			headers: ['Col1', 'Col2'],
			rows: [],
		})
	);
	const output = lastFrame() || '';
	t.true(output.includes('Col1'));
	t.true(output.includes('Col2'));
	// Should still render borders
	t.true(output.includes('┌'));
});

test('TableBlock handles alignment', t => {
	const {lastFrame} = render(
		React.createElement(TableBlock, {
			headers: ['Left', 'Center', 'Right'],
			rows: [['A', 'B', 'C']],
			alignments: ['left', 'center', 'right'],
		})
	);
	const output = lastFrame() || '';
	t.true(output.includes('Left'));
	t.true(output.includes('Center'));
	t.true(output.includes('Right'));
});

// ============================================
// HorizontalRule Component Tests (Requirement 4.2)
// ============================================

test('HorizontalRule renders a line', t => {
	const {lastFrame} = render(React.createElement(HorizontalRule));
	const output = lastFrame() || '';
	// Should contain horizontal line characters
	t.true(output.includes('─'));
});

test('HorizontalRule has consistent width', t => {
	const {lastFrame} = render(React.createElement(HorizontalRule));
	const output = lastFrame() || '';
	// Count the number of horizontal line characters
	const lineChars = (output.match(/─/g) || []).length;
	t.true(lineChars >= 40); // Should be at least 40 characters wide
});

// ============================================
// Link Component Tests (Requirement 5.2)
// ============================================

test('Link renders text and URL separately', t => {
	const {lastFrame} = render(
		React.createElement(Link, {
			text: 'Click here',
			url: 'https://example.com',
		})
	);
	const output = lastFrame() || '';
	t.true(output.includes('Click here'));
	t.true(output.includes('https://example.com'));
});

test('Link renders bare URL without duplication', t => {
	const {lastFrame} = render(
		React.createElement(Link, {
			text: 'https://example.com',
			url: 'https://example.com',
		})
	);
	const output = lastFrame() || '';
	// Should only show URL once when text equals URL
	const urlCount = (output.match(/https:\/\/example\.com/g) || []).length;
	t.is(urlCount, 1);
});

test('Link handles empty text by showing URL', t => {
	const {lastFrame} = render(
		React.createElement(Link, {
			text: '',
			url: 'https://example.com',
		})
	);
	const output = lastFrame() || '';
	t.true(output.includes('https://example.com'));
});

// ============================================
// MarkdownText Integration Tests
// ============================================

test('MarkdownText renders table from markdown', t => {
	const markdown = `| Header1 | Header2 |
|---------|---------|
| Cell1   | Cell2   |`;
	
	const {lastFrame} = render(
		React.createElement(MarkdownText, {content: markdown})
	);
	const output = lastFrame() || '';
	t.true(output.includes('Header1'));
	t.true(output.includes('Header2'));
	t.true(output.includes('Cell1'));
	t.true(output.includes('Cell2'));
});

test('MarkdownText renders horizontal rule from markdown', t => {
	const markdown = `Some text

---

More text`;
	
	const {lastFrame} = render(
		React.createElement(MarkdownText, {content: markdown})
	);
	const output = lastFrame() || '';
	t.true(output.includes('Some text'));
	t.true(output.includes('More text'));
	t.true(output.includes('─')); // Horizontal rule character
});

test('MarkdownText renders links from markdown', t => {
	const markdown = `Check out [this link](https://example.com) for more info.`;
	
	const {lastFrame} = render(
		React.createElement(MarkdownText, {content: markdown})
	);
	const output = lastFrame() || '';
	t.true(output.includes('this link'));
	t.true(output.includes('https://example.com'));
});

test('MarkdownText renders bare URLs', t => {
	const markdown = `Visit https://example.com for details.`;
	
	const {lastFrame} = render(
		React.createElement(MarkdownText, {content: markdown})
	);
	const output = lastFrame() || '';
	t.true(output.includes('https://example.com'));
});
