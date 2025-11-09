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
		// Try to match patterns in order of precedence
		// 1. Links: [text](url)
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

		// 2. Bold: **text** or __text__
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

		// 3. Italic: *text* or _text_
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

		// 4. Inline code: `code`
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

		// No match - take one character as plain text
		const char = remaining[0];

		// Merge with previous text token if exists
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

	// Check for common inline markdown patterns
	return (
		/\*\*[^\*]+\*\*/.test(text) || // Bold
		/__[^_]+__/.test(text) || // Bold
		/\*[^\*]+\*/.test(text) || // Italic
		/_[^_]+_/.test(text) || // Italic
		/`[^`]+`/.test(text) || // Code
		/\[([^\]]+)\]\(([^)]+)\)/.test(text) // Link
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
