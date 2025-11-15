/**
 * Markdown Service
 * Parses markdown text into structured blocks for rendering
 */

import {getLogger} from '../../../infrastructure/logging/Logger.js';

const logger = getLogger();

export enum BlockType {
	HEADING = 'heading',
	PARAGRAPH = 'paragraph',
	CODE_BLOCK = 'code_block',
	LIST = 'list',
	BLOCKQUOTE = 'blockquote',
}

export interface MarkdownBlock {
	type: BlockType;
	content: string;
	level?: number; // For headings (1-6) or list indent
	language?: string; // For code blocks
	items?: string[]; // For lists
}

export class MarkdownService {
	/**
	 * Parse markdown text into blocks
	 */
	parse(text: string): MarkdownBlock[] {
		const start = Date.now();
		logger.info('MarkdownService', 'parse', 'Parsing markdown text', {
			text_length: text.length,
		});

		const lines = text.split('\n');
		const blocks: MarkdownBlock[] = [];
		let i = 0;

		logger.debug('MarkdownService', 'parse', 'Starting line-by-line parsing', {
			total_lines: lines.length,
		});

		while (i < lines.length) {
			const line = lines[i];

			// Code block (```)
			if (line.trim().startsWith('```')) {
				const {block, nextIndex} = this.parseCodeBlock(lines, i);
				blocks.push(block);
				i = nextIndex;
				continue;
			}

			// Heading (#)
			if (line.trim().match(/^#{1,6}\s/)) {
				blocks.push(this.parseHeading(line));
				i++;
				continue;
			}

			// Blockquote (>)
			if (line.trim().startsWith('>')) {
				blocks.push(this.parseBlockquote(line));
				i++;
				continue;
			}

			// List (-, *, 1.)
			if (line.trim().match(/^[-*]\s/) || line.trim().match(/^\d+\.\s/)) {
				const {block, nextIndex} = this.parseList(lines, i);
				blocks.push(block);
				i = nextIndex;
				continue;
			}

			// Empty line - skip
			if (!line.trim()) {
				i++;
				continue;
			}

			// Paragraph
			const {block, nextIndex} = this.parseParagraph(lines, i);
			blocks.push(block);
			i = nextIndex;
		}

		const duration = Date.now() - start;
		logger.info('MarkdownService', 'parse', 'Markdown parsing completed', {
			duration_ms: duration,
			total_blocks: blocks.length,
			block_types: blocks.reduce((acc: Record<string, number>, b) => {
				acc[b.type] = (acc[b.type] || 0) + 1;
				return acc;
			}, {}),
		});

		return blocks;
	}

	private parseCodeBlock(
		lines: string[],
		startIndex: number,
	): {block: MarkdownBlock; nextIndex: number} {
		logger.debug('MarkdownService', 'parseCodeBlock', 'Parsing code block', {
			start_index: startIndex,
		});

		const startLine = lines[startIndex].trim();
		const language = startLine.slice(3).trim() || 'text';

		const codeLines: string[] = [];
		let i = startIndex + 1;

		// Find closing ```
		while (i < lines.length) {
			if (lines[i].trim() === '```') {
				break;
			}
			codeLines.push(lines[i]);
			i++;
		}

		logger.debug('MarkdownService', 'parseCodeBlock', 'Code block parsed', {
			language,
			lines_count: codeLines.length,
		});

		return {
			block: {
				type: BlockType.CODE_BLOCK,
				content: codeLines.join('\n'),
				language,
			},
			nextIndex: i + 1,
		};
	}

	private parseHeading(line: string): MarkdownBlock {
		logger.debug('MarkdownService', 'parseHeading', 'Parsing heading');

		const match = line.trim().match(/^(#{1,6})\s+(.+)/);
		if (!match) {
			logger.debug('MarkdownService', 'parseHeading', 'Not a valid heading, treating as paragraph');
			return {
				type: BlockType.PARAGRAPH,
				content: line,
			};
		}

		const level = match[1].length;
		const content = match[2];

		logger.debug('MarkdownService', 'parseHeading', 'Heading parsed', {
			level,
			content_length: content.length,
		});

		return {
			type: BlockType.HEADING,
			content,
			level,
		};
	}

	private parseBlockquote(line: string): MarkdownBlock {
		logger.debug('MarkdownService', 'parseBlockquote', 'Parsing blockquote');

		const content = line.trim().slice(1).trim();

		logger.debug('MarkdownService', 'parseBlockquote', 'Blockquote parsed', {
			content_length: content.length,
		});

		return {
			type: BlockType.BLOCKQUOTE,
			content,
		};
	}

	private parseList(
		lines: string[],
		startIndex: number,
	): {block: MarkdownBlock; nextIndex: number} {
		logger.debug('MarkdownService', 'parseList', 'Parsing list', {
			start_index: startIndex,
		});

		const items: string[] = [];
		let i = startIndex;

		// Collect all consecutive list items
		while (i < lines.length) {
			const line = lines[i].trim();
			if (!line) break;

			const listMatch =
				line.match(/^[-*]\s+(.+)/) || line.match(/^\d+\.\s+(.+)/);
			if (!listMatch) break;

			items.push(listMatch[1]);
			i++;
		}

		logger.debug('MarkdownService', 'parseList', 'List parsed', {
			items_count: items.length,
		});

		return {
			block: {
				type: BlockType.LIST,
				content: '',
				items,
			},
			nextIndex: i,
		};
	}

	private parseParagraph(
		lines: string[],
		startIndex: number,
	): {block: MarkdownBlock; nextIndex: number} {
		logger.debug('MarkdownService', 'parseParagraph', 'Parsing paragraph', {
			start_index: startIndex,
		});

		const paragraphLines: string[] = [];
		let i = startIndex;

		// Collect lines until empty line or special marker
		while (i < lines.length) {
			const line = lines[i];
			if (!line.trim()) break;
			if (line.trim().startsWith('```')) break;
			if (line.trim().match(/^#{1,6}\s/)) break;
			if (line.trim().startsWith('>')) break;
			if (line.trim().match(/^[-*]\s/) || line.trim().match(/^\d+\.\s/)) break;

			paragraphLines.push(line);
			i++;
		}

		const content = paragraphLines.join('\n'); // Preserve line breaks instead of joining with space

		logger.debug('MarkdownService', 'parseParagraph', 'Paragraph parsed', {
			lines_count: paragraphLines.length,
			content_length: content.length,
		});

		return {
			block: {
				type: BlockType.PARAGRAPH,
				content,
			},
			nextIndex: i,
		};
	}

	/**
	 * Parse inline markdown (bold, italic, code, links)
	 */
	parseInline(text: string): Array<{type: string; content: string}> {
		logger.debug('MarkdownService', 'parseInline', 'Parsing inline markdown', {
			text_length: text.length,
		});

		const tokens: Array<{type: string; content: string}> = [];
		let current = '';
		let i = 0;

		while (i < text.length) {
			// Bold (**text**)
			if (text.slice(i, i + 2) === '**') {
				if (current) {
					tokens.push({type: 'text', content: current});
					current = '';
				}
				i += 2;
				const end = text.indexOf('**', i);
				if (end !== -1) {
					tokens.push({type: 'bold', content: text.slice(i, end)});
					i = end + 2;
					continue;
				}
			}

			// Italic (*text* or _text_)
			if (text[i] === '*' || text[i] === '_') {
				const char = text[i];
				if (current) {
					tokens.push({type: 'text', content: current});
					current = '';
				}
				i++;
				const end = text.indexOf(char, i);
				if (end !== -1) {
					tokens.push({type: 'italic', content: text.slice(i, end)});
					i = end + 1;
					continue;
				}
			}

			// Inline code (`code`)
			if (text[i] === '`') {
				if (current) {
					tokens.push({type: 'text', content: current});
					current = '';
				}
				i++;
				const end = text.indexOf('`', i);
				if (end !== -1) {
					tokens.push({type: 'code', content: text.slice(i, end)});
					i = end + 1;
					continue;
				}
			}

			current += text[i];
			i++;
		}

		if (current) {
			tokens.push({type: 'text', content: current});
		}

		logger.debug('MarkdownService', 'parseInline', 'Inline markdown parsed', {
			tokens_count: tokens.length,
			token_types: tokens.reduce((acc: Record<string, number>, t) => {
				acc[t.type] = (acc[t.type] || 0) + 1;
				return acc;
			}, {}),
		});

		return tokens;
	}
}
