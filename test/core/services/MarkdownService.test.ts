/**
 * Unit tests for MarkdownService
 */

import test from 'ava';
import { MarkdownService, BlockType } from '../../../source/core/application/services/MarkdownService.js';

const service = new MarkdownService();

// === Heading Parsing Tests ===

test('parses H1 heading correctly', (t) => {
	const blocks = service.parse('# Title');

	t.is(blocks.length, 1);
	t.is(blocks[0].type, BlockType.HEADING);
	t.is(blocks[0].content, 'Title');
	t.is(blocks[0].level, 1);
});

test('parses H2 heading correctly', (t) => {
	const blocks = service.parse('## Subtitle');

	t.is(blocks[0].type, BlockType.HEADING);
	t.is(blocks[0].content, 'Subtitle');
	t.is(blocks[0].level, 2);
});

test('parses H3 heading correctly', (t) => {
	const blocks = service.parse('### Section');

	t.is(blocks[0].type, BlockType.HEADING);
	t.is(blocks[0].level, 3);
});

test('parses multiple headings', (t) => {
	const text = '# H1\n## H2\n### H3';
	const blocks = service.parse(text);

	t.is(blocks.length, 3);
	t.is(blocks[0].level, 1);
	t.is(blocks[1].level, 2);
	t.is(blocks[2].level, 3);
});

// === Code Block Parsing Tests ===

test('parses code block without language', (t) => {
	const text = '```\nconst x = 1;\n```';
	const blocks = service.parse(text);

	t.is(blocks.length, 1);
	t.is(blocks[0].type, BlockType.CODE_BLOCK);
	t.is(blocks[0].content, 'const x = 1;');
	t.is(blocks[0].language, '');
});

test('parses code block with language', (t) => {
	const text = '```typescript\nconst x: number = 1;\n```';
	const blocks = service.parse(text);

	t.is(blocks[0].type, BlockType.CODE_BLOCK);
	t.is(blocks[0].language, 'typescript');
	t.is(blocks[0].content, 'const x: number = 1;');
});

test('parses multi-line code block', (t) => {
	const text = '```javascript\nfunction hello() {\n  return "world";\n}\n```';
	const blocks = service.parse(text);

	t.is(blocks[0].type, BlockType.CODE_BLOCK);
	t.true(blocks[0].content.includes('function hello()'));
	t.true(blocks[0].content.includes('return "world"'));
});

test('parses multiple code blocks', (t) => {
	const text = '```js\ncode1\n```\nText\n```py\ncode2\n```';
	const blocks = service.parse(text);

	const codeBlocks = blocks.filter(b => b.type === BlockType.CODE_BLOCK);
	t.is(codeBlocks.length, 2);
	t.is(codeBlocks[0].language, 'js');
	t.is(codeBlocks[1].language, 'py');
});

// === List Parsing Tests ===

test('parses unordered list', (t) => {
	const text = '- Item 1\n- Item 2\n- Item 3';
	const blocks = service.parse(text);

	t.is(blocks.length, 1);
	t.is(blocks[0].type, BlockType.LIST);
	t.is(blocks[0].items?.length, 3);
	t.is(blocks[0].items?.[0], 'Item 1');
	t.is(blocks[0].items?.[1], 'Item 2');
	t.is(blocks[0].items?.[2], 'Item 3');
});

test('parses list with asterisks', (t) => {
	const text = '* First\n* Second';
	const blocks = service.parse(text);

	t.is(blocks[0].type, BlockType.LIST);
	t.is(blocks[0].items?.length, 2);
});

test('parses list with plus signs', (t) => {
	const text = '+ Alpha\n+ Beta';
	const blocks = service.parse(text);

	t.is(blocks[0].type, BlockType.LIST);
	t.is(blocks[0].items?.length, 2);
});

// === Blockquote Parsing Tests ===

test('parses single-line blockquote', (t) => {
	const text = '> This is a quote';
	const blocks = service.parse(text);

	t.is(blocks.length, 1);
	t.is(blocks[0].type, BlockType.BLOCKQUOTE);
	t.is(blocks[0].content, 'This is a quote');
});

test('parses multi-line blockquote', (t) => {
	const text = '> Line 1\n> Line 2\n> Line 3';
	const blocks = service.parse(text);

	t.is(blocks[0].type, BlockType.BLOCKQUOTE);
	t.true(blocks[0].content.includes('Line 1'));
	t.true(blocks[0].content.includes('Line 2'));
	t.true(blocks[0].content.includes('Line 3'));
});

// === Paragraph Parsing Tests ===

test('parses simple paragraph', (t) => {
	const text = 'This is a paragraph.';
	const blocks = service.parse(text);

	t.is(blocks.length, 1);
	t.is(blocks[0].type, BlockType.PARAGRAPH);
	t.is(blocks[0].content, 'This is a paragraph.');
});

test('parses multi-line paragraph', (t) => {
	const text = 'Line 1\nLine 2\nLine 3';
	const blocks = service.parse(text);

	// Should be one paragraph
	t.is(blocks.length, 1);
	t.is(blocks[0].type, BlockType.PARAGRAPH);
});

test('separates paragraphs by empty lines', (t) => {
	const text = 'Para 1\n\nPara 2';
	const blocks = service.parse(text);

	t.is(blocks.length, 2);
	t.is(blocks[0].type, BlockType.PARAGRAPH);
	t.is(blocks[1].type, BlockType.PARAGRAPH);
});

// === Inline Formatting Tests ===

test('parses inline code', (t) => {
	const tokens = service['parseInlineFormatting']('Use `const` for constants');

	const codeToken = tokens.find(t => t.type === 'code');
	t.truthy(codeToken);
	t.is(codeToken?.content, 'const');
});

test('parses bold text with **', (t) => {
	const tokens = service['parseInlineFormatting']('This is **bold** text');

	const boldToken = tokens.find(t => t.type === 'bold');
	t.truthy(boldToken);
	t.is(boldToken?.content, 'bold');
});

test('parses bold text with __', (t) => {
	const tokens = service['parseInlineFormatting']('This is __bold__ text');

	const boldToken = tokens.find(t => t.type === 'bold');
	t.truthy(boldToken);
	t.is(boldToken?.content, 'bold');
});

test('parses italic text with *', (t) => {
	const tokens = service['parseInlineFormatting']('This is *italic* text');

	const italicToken = tokens.find(t => t.type === 'italic');
	t.truthy(italicToken);
	t.is(italicToken?.content, 'italic');
});

test('parses italic text with _', (t) => {
	const tokens = service['parseInlineFormatting']('This is _italic_ text');

	const italicToken = tokens.find(t => t.type === 'italic');
	t.truthy(italicToken);
	t.is(italicToken?.content, 'italic');
});

test('parses mixed inline formatting', (t) => {
	const tokens = service['parseInlineFormatting']('**bold** and *italic* and `code`');

	t.is(tokens.length, 5); // bold, text, italic, text, code
	t.is(tokens.filter(t => t.type === 'bold').length, 1);
	t.is(tokens.filter(t => t.type === 'italic').length, 1);
	t.is(tokens.filter(t => t.type === 'code').length, 1);
});

// === Complex Markdown Tests ===

test('parses complex markdown with multiple block types', (t) => {
	const text = `# Title

This is a paragraph.

## Section

- Item 1
- Item 2

\`\`\`javascript
const x = 1;
\`\`\`

> A quote

Another paragraph.`;

	const blocks = service.parse(text);

	t.true(blocks.length >= 6);

	const headings = blocks.filter(b => b.type === BlockType.HEADING);
	const paragraphs = blocks.filter(b => b.type === BlockType.PARAGRAPH);
	const lists = blocks.filter(b => b.type === BlockType.LIST);
	const codeBlocks = blocks.filter(b => b.type === BlockType.CODE_BLOCK);
	const quotes = blocks.filter(b => b.type === BlockType.BLOCKQUOTE);

	t.is(headings.length, 2);
	t.is(paragraphs.length, 2);
	t.is(lists.length, 1);
	t.is(codeBlocks.length, 1);
	t.is(quotes.length, 1);
});

// === Edge Cases Tests ===

test('handles empty string', (t) => {
	const blocks = service.parse('');

	t.is(blocks.length, 0);
});

test('handles string with only whitespace', (t) => {
	const blocks = service.parse('   \n\n   ');

	t.is(blocks.length, 0);
});

test('handles unclosed code block', (t) => {
	const text = '```javascript\ncode without closing';
	const blocks = service.parse(text);

	// Should still parse as code block
	t.is(blocks[0].type, BlockType.CODE_BLOCK);
});

test('handles heading without space after #', (t) => {
	const text = '#NoSpace';
	const blocks = service.parse(text);

	// Should not be parsed as heading
	t.not(blocks[0]?.type, BlockType.HEADING);
});

test('handles list items with extra spaces', (t) => {
	const text = '-   Item with spaces\n-Item without';
	const blocks = service.parse(text);

	t.is(blocks[0].type, BlockType.LIST);
	t.is(blocks[0].items?.length, 2);
});
