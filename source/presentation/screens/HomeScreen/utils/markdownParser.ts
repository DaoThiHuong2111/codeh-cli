/**
 * Markdown parsing utilities
 */

import type {
	AnyMarkdownBlock,
	CodeBlock,
	CodeFenceInfo,
	HeadingBlock,
	HeadingLevel,
	ListBlock,
	ListItem,
	ListType,
	ParagraphBlock,
	TableBlock,
} from '../types/markdown';

/**
 * Parse markdown text into blocks
 */
export function parseMarkdown(text: string): AnyMarkdownBlock[] {
	if (!text) return [];

	const lines = text.split(/\r?\n/);
	const blocks: AnyMarkdownBlock[] = [];

	let i = 0;
	while (i < lines.length) {
		const line = lines[i];

		if (line.trim() === '') {
			i++;
			continue;
		}

		const heading = parseHeading(line);
		if (heading) {
			blocks.push(heading);
			i++;
			continue;
		}

		const codeFence = extractCodeFence(line);
		if (codeFence) {
			const codeBlock = parseCodeBlock(lines, i);
			if (codeBlock) {
				blocks.push(codeBlock.block);
				i = codeBlock.nextIndex;
				continue;
			}
		}

		if (isHorizontalRule(line)) {
			blocks.push({type: 'hr', content: line});
			i++;
			continue;
		}

		if (isListItem(line)) {
			const listBlock = parseList(lines, i);
			if (listBlock) {
				blocks.push(listBlock.block);
				i = listBlock.nextIndex;
				continue;
			}
		}

		if (
			isTableRow(line) &&
			i + 1 < lines.length &&
			isTableSeparator(lines[i + 1])
		) {
			const tableBlock = parseTable(lines, i);
			if (tableBlock) {
				blocks.push(tableBlock.block);
				i = tableBlock.nextIndex;
				continue;
			}
		}

		if (line.trim().startsWith('>')) {
			const blockquote = parseBlockquote(lines, i);
			if (blockquote) {
				blocks.push(blockquote.block);
				i = blockquote.nextIndex;
				continue;
			}
		}

		const paragraph = parseParagraph(lines, i);
		blocks.push(paragraph.block);
		i = paragraph.nextIndex;
	}

	return blocks;
}

/**
 * Extract code fence information from a line
 */
export function extractCodeFence(line: string): CodeFenceInfo | null {
	const match = line.match(/^ *(`{3,}|~{3,}) *(\w*?) *$/);
	if (!match) return null;

	return {
		fence: match[1],
		language: match[2] || null,
	};
}

/**
 * Parse heading line
 */
function parseHeading(line: string): HeadingBlock | null {
	const match = line.match(/^ *(#{1,4}) +(.+)/);
	if (!match) return null;

	const level = match[1].length as HeadingLevel;
	const content = match[2];

	return {
		type: 'heading',
		level,
		content,
	};
}

/**
 * Parse code block starting from current index
 */
function parseCodeBlock(
	lines: string[],
	startIndex: number,
): {block: CodeBlock; nextIndex: number} | null {
	const firstLine = lines[startIndex];
	const fenceInfo = extractCodeFence(firstLine);
	if (!fenceInfo) return null;

	const codeLines: string[] = [];
	let i = startIndex + 1;

	while (i < lines.length) {
		const line = lines[i];
		const closingFence = extractCodeFence(line);

		if (
			closingFence &&
			closingFence.fence[0] === fenceInfo.fence[0] &&
			closingFence.fence.length >= fenceInfo.fence.length
		) {
			break;
		}

		codeLines.push(line);
		i++;
	}

	return {
		block: {
			type: 'code',
			language: fenceInfo.language,
			code: codeLines.join('\n'),
			content: codeLines.join('\n'),
		},
		nextIndex: i + 1,
	};
}

/**
 * Check if line is a horizontal rule
 */
function isHorizontalRule(line: string): boolean {
	return /^ *([-*_] *){3,} *$/.test(line);
}

/**
 * Check if line is a list item
 */
function isListItem(line: string): boolean {
	return /^([ \t]*)([*+-]|\d+\.) +(.+)/.test(line);
}

/**
 * Parse list block
 */
function parseList(
	lines: string[],
	startIndex: number,
): {block: ListBlock; nextIndex: number} | null {
	const firstLine = lines[startIndex];
	const firstMatch = firstLine.match(/^([ \t]*)([*+-]|\d+\.) +(.+)/);
	if (!firstMatch) return null;

	const listType: ListType = /^\d+\./.test(firstMatch[2])
		? 'ordered'
		: 'unordered';
	const items: ListItem[] = [];

	let i = startIndex;
	while (i < lines.length) {
		const line = lines[i];
		const match = line.match(/^([ \t]*)([*+-]|\d+\.) +(.+)/);

		if (!match) break;

		// Check if it's the same list type
		const isOrdered = /^\d+\./.test(match[2]);
		if (
			(isOrdered && listType !== 'ordered') ||
			(!isOrdered && listType !== 'unordered')
		) {
			break;
		}

		items.push({
			indent: match[1].length,
			content: match[3],
		});

		i++;
	}

	return {
		block: {
			type: 'list',
			listType,
			items,
			content: items.map(item => item.content).join('\n'),
		},
		nextIndex: i,
	};
}

/**
 * Check if line is a table row
 */
function isTableRow(line: string): boolean {
	return /^\s*\|(.+)\|\s*$/.test(line);
}

/**
 * Check if line is a table separator
 */
function isTableSeparator(line: string): boolean {
	return /^\s*\|?\s*(:?-+:?)\s*(\|\s*(:?-+:?)\s*)+\|?\s*$/.test(line);
}

/**
 * Parse table block
 */
function parseTable(
	lines: string[],
	startIndex: number,
): {block: TableBlock; nextIndex: number} | null {
	const headerLine = lines[startIndex];
	const separatorLine = lines[startIndex + 1];

	if (!isTableRow(headerLine) || !isTableSeparator(separatorLine)) {
		return null;
	}

	const headerMatch = headerLine.match(/^\s*\|(.+)\|\s*$/);
	if (!headerMatch) return null;

	const headers = headerMatch[1]
		.split('|')
		.map(cell => cell.trim())
		.filter(cell => cell.length > 0);

	const rows: string[][] = [];
	let i = startIndex + 2;

	while (i < lines.length) {
		const line = lines[i];
		if (!isTableRow(line)) break;

		const rowMatch = line.match(/^\s*\|(.+)\|\s*$/);
		if (!rowMatch) break;

		const cells = rowMatch[1]
			.split('|')
			.map(cell => cell.trim())
			.filter(cell => cell.length > 0);

		rows.push(cells);
		i++;
	}

	return {
		block: {
			type: 'table',
			headers,
			rows,
			content: `Table: ${headers.join(', ')}`,
		},
		nextIndex: i,
	};
}

/**
 * Parse blockquote
 */
function parseBlockquote(
	lines: string[],
	startIndex: number,
): {block: {type: 'blockquote'; content: string}; nextIndex: number} | null {
	const quoteLines: string[] = [];
	let i = startIndex;

	while (i < lines.length) {
		const line = lines[i];
		if (!line.trim().startsWith('>')) break;

		quoteLines.push(line.replace(/^\s*>\s?/, ''));
		i++;
	}

	return {
		block: {
			type: 'blockquote',
			content: quoteLines.join('\n'),
		},
		nextIndex: i,
	};
}

/**
 * Parse paragraph
 */
function parseParagraph(
	lines: string[],
	startIndex: number,
): {block: ParagraphBlock; nextIndex: number} {
	const paragraphLines: string[] = [];
	let i = startIndex;

	while (i < lines.length) {
		const line = lines[i];

		if (
			line.trim() === '' ||
			parseHeading(line) ||
			extractCodeFence(line) ||
			isHorizontalRule(line) ||
			isListItem(line) ||
			isTableRow(line) ||
			line.trim().startsWith('>')
		) {
			break;
		}

		paragraphLines.push(line);
		i++;
	}

	return {
		block: {
			type: 'paragraph',
			content: paragraphLines.join(' '),
		},
		nextIndex: i,
	};
}
