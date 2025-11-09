/**
 * Markdown Service
 * Parses markdown text into structured blocks for rendering
 */

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
		const lines = text.split('\n');
		const blocks: MarkdownBlock[] = [];
		let i = 0;

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

		return blocks;
	}

	private parseCodeBlock(
		lines: string[],
		startIndex: number,
	): {block: MarkdownBlock; nextIndex: number} {
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
		const match = line.trim().match(/^(#{1,6})\s+(.+)/);
		if (!match) {
			return {
				type: BlockType.PARAGRAPH,
				content: line,
			};
		}

		const level = match[1].length;
		const content = match[2];

		return {
			type: BlockType.HEADING,
			content,
			level,
		};
	}

	private parseBlockquote(line: string): MarkdownBlock {
		const content = line.trim().slice(1).trim();
		return {
			type: BlockType.BLOCKQUOTE,
			content,
		};
	}

	private parseList(
		lines: string[],
		startIndex: number,
	): {block: MarkdownBlock; nextIndex: number} {
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

		return {
			block: {
				type: BlockType.PARAGRAPH,
				content: paragraphLines.join(' '),
			},
			nextIndex: i,
		};
	}

	/**
	 * Parse inline markdown (bold, italic, code, links)
	 */
	parseInline(text: string): Array<{type: string; content: string}> {
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

		return tokens;
	}
}
