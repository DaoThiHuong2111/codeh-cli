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
	TABLE = 'table',
	HORIZONTAL_RULE = 'hr',
}

export interface MarkdownBlock {
	type: BlockType;
	content: string;
	level?: number; // For headings (1-6) or list indent
	language?: string; // For code blocks
	items?: string[]; // For lists
	headers?: string[]; // For tables
	rows?: string[][]; // For tables
	alignments?: ('left' | 'center' | 'right')[]; // For tables
}

export class MarkdownService {
	/**
	 * Parse markdown text into blocks
	 * Implements robust error handling - falls back to raw text on parse failures
	 */
	parse(text: string): MarkdownBlock[] {
		const start = Date.now();
		logger.info('MarkdownService', 'parse', 'Parsing markdown text', {
			text_length: text.length,
		});

		try {
			// Sanitize HTML before parsing
			const sanitizedText = this.sanitizeHtml(text);

			const lines = sanitizedText.split('\n');
			const blocks: MarkdownBlock[] = [];
			let i = 0;

			logger.debug('MarkdownService', 'parse', 'Starting line-by-line parsing', {
				total_lines: lines.length,
			});

			while (i < lines.length) {
				const line = lines[i];

				try {
					// Code block (```)
					if (line.trim().startsWith('```')) {
						const {block, nextIndex} = this.parseCodeBlock(lines, i);
						// Skip empty code blocks
						if (block.content.trim() || block.language) {
							blocks.push(block);
						}
						i = nextIndex;
						continue;
					}

					// Heading (#)
					if (line.trim().match(/^#{1,6}\s/)) {
						const headingBlock = this.parseHeading(line);
						// Skip empty headings
						if (headingBlock.content.trim()) {
							blocks.push(headingBlock);
						}
						i++;
						continue;
					}

					// Blockquote (>)
					if (line.trim().startsWith('>')) {
						const blockquoteBlock = this.parseBlockquote(line);
						// Skip empty blockquotes (just ">")
						if (blockquoteBlock.content.trim()) {
							blocks.push(blockquoteBlock);
						}
						i++;
						continue;
					}

					// Horizontal rule (---, ***, ___) - check BEFORE list items
					// This is important because --- could be confused with a list item
					const hrBlock = this.parseHorizontalRule(line);
					if (hrBlock) {
						blocks.push(hrBlock);
						i++;
						continue;
					}

					// List (-, *, 1.)
					if (line.trim().match(/^[-*]\s/) || line.trim().match(/^\d+\.\s/)) {
						const {block, nextIndex} = this.parseList(lines, i);
						// Skip empty lists
						if (block.items && block.items.length > 0 && block.items.some(item => item.trim())) {
							blocks.push(block);
						}
						i = nextIndex;
						continue;
					}

					// Table (| ... |)
					if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
						const tableResult = this.parseTable(lines, i);
						if (tableResult) {
							blocks.push(tableResult.block);
							i = tableResult.nextIndex;
							continue;
						}
					}

					// Empty line - skip
					if (!line.trim()) {
						i++;
						continue;
					}

					// Paragraph
					const {block, nextIndex} = this.parseParagraph(lines, i);
					// Skip empty paragraphs
					if (block.content.trim()) {
						blocks.push(block);
					}
					i = nextIndex;
				} catch (lineError) {
					// If parsing a specific line fails, treat it as a paragraph and continue
					logger.warn('MarkdownService', 'parse', 'Error parsing line, treating as paragraph', {
						line_index: i,
						error: lineError instanceof Error ? lineError.message : String(lineError),
					});
					
					// Add the line as a plain paragraph
					if (line.trim()) {
						blocks.push({
							type: BlockType.PARAGRAPH,
							content: line,
						});
					}
					i++;
				}
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
		} catch (error) {
			// If parsing fails completely, fall back to raw text as a single paragraph
			logger.error('MarkdownService', 'parse', 'Markdown parsing failed, falling back to raw text', {
				error: error instanceof Error ? error.message : String(error),
			});
			
			// Return the original text as a single paragraph block
			return [{
				type: BlockType.PARAGRAPH,
				content: text,
			}];
		}
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
			logger.debug(
				'MarkdownService',
				'parseHeading',
				'Not a valid heading, treating as paragraph',
			);
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

		// Remove the leading > and any following space
		let content = line.trim().slice(1).trim();

		// Check for nested blockquotes (multiple >)
		let nestedLevel = 1;
		while (content.startsWith('>')) {
			nestedLevel++;
			content = content.slice(1).trim();
		}

		logger.debug('MarkdownService', 'parseBlockquote', 'Blockquote parsed', {
			content_length: content.length,
			nested_level: nestedLevel,
		});

		return {
			type: BlockType.BLOCKQUOTE,
			content,
			level: nestedLevel,
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

	private parseTable(
		lines: string[],
		startIndex: number,
	): {block: MarkdownBlock; nextIndex: number} | null {
		logger.debug('MarkdownService', 'parseTable', 'Attempting to parse table', {
			start_index: startIndex,
		});

		// Need at least 2 lines for a valid table (header + alignment)
		if (startIndex + 1 >= lines.length) {
			logger.debug(
				'MarkdownService',
				'parseTable',
				'Not enough lines for table',
			);
			return null;
		}

		const headerLine = lines[startIndex].trim();
		const alignLine = lines[startIndex + 1].trim();

		// Validate header line format
		if (!headerLine.startsWith('|') || !headerLine.endsWith('|')) {
			logger.debug(
				'MarkdownService',
				'parseTable',
				'Invalid header line format',
			);
			return null;
		}

		// Validate alignment line format (should contain dashes and colons)
		if (
			!alignLine.startsWith('|') ||
			!alignLine.endsWith('|') ||
			!alignLine.match(/[-:]+/)
		) {
			logger.debug(
				'MarkdownService',
				'parseTable',
				'Invalid alignment line format',
			);
			return null;
		}

		try {
			// Parse header row
			const headers = headerLine
				.slice(1, -1) // Remove leading and trailing |
				.split('|')
				.map(h => h.trim())
				.filter(h => h.length > 0);

			if (headers.length === 0) {
				logger.debug('MarkdownService', 'parseTable', 'No headers found');
				return null;
			}

			// Parse alignment row
			const alignCells = alignLine
				.slice(1, -1)
				.split('|')
				.map(a => a.trim())
				.filter(a => a.length > 0);

			// Validate alignment cells match header count
			if (alignCells.length !== headers.length) {
				logger.debug(
					'MarkdownService',
					'parseTable',
					'Alignment cells do not match header count',
					{
						headers_count: headers.length,
						align_count: alignCells.length,
					},
				);
				return null;
			}

			// Determine alignments
			const alignments: ('left' | 'center' | 'right')[] = alignCells.map(
				cell => {
					const startsWithColon = cell.startsWith(':');
					const endsWithColon = cell.endsWith(':');

					if (startsWithColon && endsWithColon) return 'center';
					if (endsWithColon) return 'right';
					return 'left';
				},
			);

			// Parse data rows
			const rows: string[][] = [];
			let i = startIndex + 2;

			while (i < lines.length) {
				const line = lines[i].trim();

				// Stop if we hit an empty line or non-table line
				if (!line || !line.startsWith('|') || !line.endsWith('|')) {
					break;
				}

				// Parse row cells
				const cells = line
					.slice(1, -1)
					.split('|')
					.map(c => c.trim());

				// Ensure row has correct number of cells (pad or truncate if needed)
				while (cells.length < headers.length) {
					cells.push('');
				}
				if (cells.length > headers.length) {
					cells.length = headers.length;
				}

				rows.push(cells);
				i++;
			}

			logger.debug(
				'MarkdownService',
				'parseTable',
				'Table parsed successfully',
				{
					headers_count: headers.length,
					rows_count: rows.length,
				},
			);

			return {
				block: {
					type: BlockType.TABLE,
					content: '', // Content is stored in headers and rows
					headers,
					rows,
					alignments,
				},
				nextIndex: i,
			};
		} catch (error) {
			logger.error('MarkdownService', 'parseTable', 'Error parsing table', {
				error,
			});
			return null;
		}
	}

	/**
	 * Parse horizontal rule (---, ***, ___)
	 * Returns a horizontal rule block if the line matches the pattern, null otherwise
	 */
	private parseHorizontalRule(line: string): MarkdownBlock | null {
		logger.debug(
			'MarkdownService',
			'parseHorizontalRule',
			'Attempting to parse horizontal rule',
		);

		const trimmed = line.trim();

		// Horizontal rule patterns:
		// - Three or more hyphens: ---, ----, -----
		// - Three or more asterisks: ***, ****, *****
		// - Three or more underscores: ___, ____, _____
		// Optional spaces between characters are allowed

		// Check for horizontal rule patterns
		// Must be at least 3 characters of the same type
		// Can have spaces between them
		const hrPatterns = [
			/^-{3,}$/, // Three or more hyphens
			/^\*{3,}$/, // Three or more asterisks
			/^_{3,}$/, // Three or more underscores
			/^(-\s*){3,}$/, // Three or more hyphens with optional spaces
			/^(\*\s*){3,}$/, // Three or more asterisks with optional spaces
			/^(_\s*){3,}$/, // Three or more underscores with optional spaces
		];

		for (const pattern of hrPatterns) {
			if (pattern.test(trimmed)) {
				logger.debug(
					'MarkdownService',
					'parseHorizontalRule',
					'Horizontal rule detected',
					{
						pattern: pattern.toString(),
					},
				);

				return {
					type: BlockType.HORIZONTAL_RULE,
					content: '',
				};
			}
		}

		logger.debug(
			'MarkdownService',
			'parseHorizontalRule',
			'Not a horizontal rule',
		);
		return null;
	}

	/**
	 * Parse inline markdown (bold, italic, code, links) with support for nested formatting
	 * Implements robust error handling - unclosed markers are treated as literals
	 */
	parseInline(
		text: string,
	): Array<{type: string; content: string; url?: string; children?: Array<{type: string; content: string; url?: string}>}> {
		logger.debug('MarkdownService', 'parseInline', 'Parsing inline markdown', {
			text_length: text.length,
		});

		try {
			const tokens: Array<{type: string; content: string; url?: string; children?: Array<{type: string; content: string; url?: string}>}> = [];
			let current = '';
			let i = 0;

			while (i < text.length) {
			// Handle escaped characters - they should appear as literals
			if (text[i] === '\\' && i + 1 < text.length) {
				const nextChar = text[i + 1];
				// Check if next character is a markdown special character
				if (
					nextChar === '*' ||
					nextChar === '#' ||
					nextChar === '_' ||
					nextChar === '[' ||
					nextChar === ']' ||
					nextChar === '`' ||
					nextChar === '\\' ||
					nextChar === '{' ||
					nextChar === '}' ||
					nextChar === '(' ||
					nextChar === ')' ||
					nextChar === '+' ||
					nextChar === '-' ||
					nextChar === '.' ||
					nextChar === '!'
				) {
					// Add the literal character (without backslash)
					current += nextChar;
					i += 2; // Skip both backslash and the character
					continue;
				}
			}

			// Links ([text](url))
			if (text[i] === '[') {
				// Try to parse as a link
				const closeBracket = text.indexOf(']', i + 1);
				if (closeBracket !== -1 && text[closeBracket + 1] === '(') {
					const closeParen = text.indexOf(')', closeBracket + 2);
					if (closeParen !== -1) {
						// Valid link found
						if (current) {
							tokens.push({type: 'text', content: current});
							current = '';
						}

						const linkText = text.slice(i + 1, closeBracket);
						const linkUrl = text.slice(closeBracket + 2, closeParen);

						tokens.push({
							type: 'link',
							content: linkText || linkUrl, // Use URL if text is empty
							url: linkUrl,
						});

						i = closeParen + 1;
						continue;
					}
				}
			}

			// Bare URLs (http:// or https://)
			if (
				text.slice(i, i + 7) === 'http://' ||
				text.slice(i, i + 8) === 'https://'
			) {
				// Find the end of the URL (space, newline, or end of string)
				let urlEnd = i;
				while (
					urlEnd < text.length &&
					text[urlEnd] !== ' ' &&
					text[urlEnd] !== '\n' &&
					text[urlEnd] !== '\t' &&
					text[urlEnd] !== ')' &&
					text[urlEnd] !== ']' &&
					text[urlEnd] !== '>' &&
					text[urlEnd] !== '<'
				) {
					urlEnd++;
				}

				if (current) {
					tokens.push({type: 'text', content: current});
					current = '';
				}

				const url = text.slice(i, urlEnd);
				tokens.push({
					type: 'link',
					content: url,
					url: url,
				});

				i = urlEnd;
				continue;
			}

			// Bold+Italic (***text*** or ___text___) - must check before bold and italic
			if (text.slice(i, i + 3) === '***' || text.slice(i, i + 3) === '___') {
				const marker = text.slice(i, i + 3);
				if (current) {
					tokens.push({type: 'text', content: current});
					current = '';
				}
				i += 3;
				const end = text.indexOf(marker, i);
				if (end !== -1) {
					const innerContent = text.slice(i, end);
					// Parse inner content recursively for any nested formatting
					const innerTokens = this.parseInlineSimple(innerContent);
					tokens.push({
						type: 'bold_italic',
						content: innerContent,
						children: innerTokens,
					});
					i = end + 3;
					continue;
				} else {
					// No closing marker, treat as literal
					current += marker;
					continue;
				}
			}

			// Bold (**text** or __text__)
			if (text.slice(i, i + 2) === '**' || text.slice(i, i + 2) === '__') {
				const marker = text.slice(i, i + 2);
				if (current) {
					tokens.push({type: 'text', content: current});
					current = '';
				}
				i += 2;
				const end = this.findClosingMarker(text, i, marker);
				if (end !== -1) {
					const innerContent = text.slice(i, end);
					// Parse inner content recursively for nested italic or code
					const innerTokens = this.parseInlineSimple(innerContent);
					tokens.push({
						type: 'bold',
						content: innerContent,
						children: innerTokens,
					});
					i = end + 2;
					continue;
				} else {
					// No closing marker, treat as literal
					current += marker;
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
				const end = this.findClosingMarker(text, i, char);
				if (end !== -1) {
					const innerContent = text.slice(i, end);
					// Parse inner content recursively for nested bold or code
					const innerTokens = this.parseInlineSimple(innerContent);
					tokens.push({
						type: 'italic',
						content: innerContent,
						children: innerTokens,
					});
					i = end + 1;
					continue;
				} else {
					// No closing marker, treat as literal
					current += char;
					continue;
				}
			}

			// Inline code (`code`) - code content is NOT parsed recursively
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
				} else {
					// No closing backtick, treat as literal
					current += '`';
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
		} catch (error) {
			// If inline parsing fails, return the text as a single text token
			logger.error('MarkdownService', 'parseInline', 'Inline parsing failed, returning raw text', {
				error: error instanceof Error ? error.message : String(error),
			});
			return [{type: 'text', content: text}];
		}
	}

	/**
	 * Find the closing marker for bold/italic, handling nested markers
	 */
	private findClosingMarker(text: string, startIndex: number, marker: string): number {
		let i = startIndex;
		
		while (i < text.length) {
			// Skip escaped characters
			if (text[i] === '\\' && i + 1 < text.length) {
				i += 2;
				continue;
			}
			
			// Handle inline code - skip its content entirely
			if (text[i] === '`') {
				const codeEnd = text.indexOf('`', i + 1);
				if (codeEnd !== -1) {
					i = codeEnd + 1;
					continue;
				}
			}
			
			// For single character markers (* or _), we need to be careful about ** and __
			if (marker.length === 1) {
				// Check if this is a double marker (** or __) - skip it
				if (text.slice(i, i + 2) === marker + marker) {
					// Find the closing double marker
					const doubleEnd = text.indexOf(marker + marker, i + 2);
					if (doubleEnd !== -1) {
						i = doubleEnd + 2;
						continue;
					}
				}
				
				// Check for single marker match
				if (text[i] === marker) {
					// Make sure it's not part of a double marker
					if (i + 1 < text.length && text[i + 1] === marker) {
						// This is the start of a double marker, skip it
						const doubleEnd = text.indexOf(marker + marker, i + 2);
						if (doubleEnd !== -1) {
							i = doubleEnd + 2;
							continue;
						}
					}
					return i;
				}
			} else {
				// For double markers (** or __), just find the next occurrence
				if (text.slice(i, i + marker.length) === marker) {
					return i;
				}
			}
			
			i++;
		}
		
		return -1;
	}

	/**
	 * Simple inline parser for nested content (handles bold, italic, code within formatted text)
	 */
	private parseInlineSimple(text: string): Array<{type: string; content: string; url?: string}> {
		const tokens: Array<{type: string; content: string; url?: string}> = [];
		let current = '';
		let i = 0;

		while (i < text.length) {
			// Handle escaped characters
			if (text[i] === '\\' && i + 1 < text.length) {
				const nextChar = text[i + 1];
				if ('*#_[]`\\{}()+-!'.includes(nextChar)) {
					current += nextChar;
					i += 2;
					continue;
				}
			}

			// Inline code (`code`) - highest priority, content not parsed
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
				} else {
					current += '`';
					continue;
				}
			}

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
				} else {
					current += '**';
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
				} else {
					current += char;
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

	/**
	 * Remove HTML tags from text
	 */
	private sanitizeHtml(text: string): string {
		logger.debug('MarkdownService', 'sanitizeHtml', 'Sanitizing HTML', {
			text_length: text.length,
		});

		// Remove HTML tags (including self-closing tags and tags with attributes)
		let sanitized = text.replace(/<[^>]*>/g, '');

		// Decode HTML entities
		sanitized = this.decodeHtmlEntities(sanitized);

		// Decode URL-encoded characters
		sanitized = this.decodeUrlEncoding(sanitized);

		logger.debug('MarkdownService', 'sanitizeHtml', 'HTML sanitized', {
			original_length: text.length,
			sanitized_length: sanitized.length,
		});

		return sanitized;
	}

	/**
	 * Decode HTML entities to their character equivalents
	 */
	private decodeHtmlEntities(text: string): string {
		logger.debug(
			'MarkdownService',
			'decodeHtmlEntities',
			'Decoding HTML entities',
		);

		const entities: Record<string, string> = {
			'&nbsp;': ' ',
			'&lt;': '<',
			'&gt;': '>',
			'&amp;': '&',
			'&quot;': '"',
			'&apos;': "'",
			'&#39;': "'",
			'&ndash;': '–',
			'&mdash;': '—',
			'&hellip;': '…',
			'&copy;': '©',
			'&reg;': '®',
			'&trade;': '™',
		};

		let decoded = text;
		for (const [entity, char] of Object.entries(entities)) {
			decoded = decoded.replace(new RegExp(entity, 'g'), char);
		}

		// Handle numeric entities (&#123; and &#xAB;)
		decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
			return String.fromCharCode(parseInt(dec, 10));
		});
		decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
			return String.fromCharCode(parseInt(hex, 16));
		});

		logger.debug(
			'MarkdownService',
			'decodeHtmlEntities',
			'HTML entities decoded',
		);

		return decoded;
	}

	/**
	 * Decode URL-encoded characters (percent-encoding)
	 */
	private decodeUrlEncoding(text: string): string {
		logger.debug(
			'MarkdownService',
			'decodeUrlEncoding',
			'Decoding URL-encoded characters',
		);

		// Decode percent-encoded characters
		// Use a regex to find all %XX patterns and decode them
		const decoded = text.replace(/%([0-9A-Fa-f]{2})/g, (match, hex) => {
			return String.fromCharCode(parseInt(hex, 16));
		});

		logger.debug(
			'MarkdownService',
			'decodeUrlEncoding',
			'URL-encoded characters decoded',
		);

		return decoded;
	}
}
