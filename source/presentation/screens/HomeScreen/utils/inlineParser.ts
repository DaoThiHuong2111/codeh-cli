/**
 * Parse inline markdown tokens (bold, italic, code, links)
 */

import type {InlineToken} from '../types/markdown';

/**
 * Parse inline markdown into tokens
 */
export function parseInlineTokens(text: string): InlineToken[] {
	if (!text) return [];

	const tokens: InlineToken[] = [];
	let remaining = text;
	let index = 0;

	while (remaining.length > 0) {
		const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
		if (linkMatch) {
			tokens.push({
				type: 'link',
				content: linkMatch[1],
				url: linkMatch[2],
			});
			remaining = remaining.substring(linkMatch[0].length);
			index += linkMatch[0].length;
			continue;
		}

		const boldMatch = remaining.match(/^(\*\*|__)([^\*_]+?)\1/);
		if (boldMatch) {
			tokens.push({
				type: 'bold',
				content: boldMatch[2],
			});
			remaining = remaining.substring(boldMatch[0].length);
			index += boldMatch[0].length;
			continue;
		}

		const italicMatch = remaining.match(/^(\*|_)([^\*_]+?)\1/);
		if (italicMatch) {
			tokens.push({
				type: 'italic',
				content: italicMatch[2],
			});
			remaining = remaining.substring(italicMatch[0].length);
			index += italicMatch[0].length;
			continue;
		}

		const codeMatch = remaining.match(/^`([^`]+)`/);
		if (codeMatch) {
			tokens.push({
				type: 'code',
				content: codeMatch[1],
			});
			remaining = remaining.substring(codeMatch[0].length);
			index += codeMatch[0].length;
			continue;
		}

		const char = remaining[0];

		const lastToken = tokens[tokens.length - 1];
		if (lastToken && lastToken.type === 'text') {
			lastToken.content += char;
		} else {
			tokens.push({
				type: 'text',
				content: char,
			});
		}

		remaining = remaining.substring(1);
		index += 1;
	}

	return tokens;
}

/**
 * Check if text contains inline markdown
 */
export function hasInlineMarkdown(text: string): boolean {
	if (!text) return false;

	return (
		/\*\*[^\*]+\*\*/.test(text) ||
		/__[^_]+__/.test(text) ||
		/\*[^\*]+\*/.test(text) ||
		/_[^_]+_/.test(text) ||
		/`[^`]+`/.test(text) ||
		/\[([^\]]+)\]\(([^)]+)\)/.test(text)
	);
}

/**
 * Strip all inline markdown formatting
 */
export function stripInlineMarkdown(text: string): string {
	if (!text) return '';

	return text
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
		.replace(/(\*\*|__)([^\*_]+?)\1/g, '$2') // Bold
		.replace(/(\*|_)([^\*_]+?)\1/g, '$2') // Italic
		.replace(/`([^`]+)`/g, '$1'); // Code
}
