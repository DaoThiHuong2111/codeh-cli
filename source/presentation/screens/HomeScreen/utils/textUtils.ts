/**
 * Text processing utilities
 */

/**
 * Wrap text to fit within specified width
 * @param text - Text to wrap
 * @param width - Maximum width per line
 * @returns Array of wrapped lines
 */
export function wrapText(text: string, width: number): string[] {
	if (!text) return [];
	if (width <= 0) return [text];

	const words = text.split(/\s+/);
	const lines: string[] = [];
	let currentLine = '';

	for (const word of words) {
		const testLine = currentLine ? `${currentLine} ${word}` : word;
		const testWidth = measureTextWidth(testLine);

		if (testWidth <= width) {
			currentLine = testLine;
		} else {
			if (currentLine) {
				lines.push(currentLine);
			}
			// If single word is too long, split it
			if (measureTextWidth(word) > width) {
				const chunks = splitLongWord(word, width);
				lines.push(...chunks.slice(0, -1));
				currentLine = chunks[chunks.length - 1];
			} else {
				currentLine = word;
			}
		}
	}

	if (currentLine) {
		lines.push(currentLine);
	}

	return lines.length > 0 ? lines : [''];
}

/**
 * Truncate text to maximum length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param ellipsis - Ellipsis string (default: '...')
 * @returns Truncated text
 */
export function truncateText(
	text: string,
	maxLength: number,
	ellipsis: string = '...',
): string {
	if (!text || text.length <= maxLength) return text;

	const truncated = text.substring(0, maxLength - ellipsis.length);
	return truncated + ellipsis;
}

/**
 * Measure text width (accounting for wide characters)
 * For now, simple implementation - can be enhanced with string-width package
 * @param text - Text to measure
 * @returns Width in characters
 */
export function measureTextWidth(text: string): number {
	if (!text) return 0;

	// Simple implementation: count characters
	// For more accurate measurement with CJK characters, use string-width package:
	// import stringWidth from 'string-width';
	// return stringWidth(text);

	return text.length;
}

/**
 * Split a long word into chunks that fit within width
 * @param word - Word to split
 * @param width - Maximum width per chunk
 * @returns Array of word chunks
 */
function splitLongWord(word: string, width: number): string[] {
	const chunks: string[] = [];
	let remaining = word;

	while (remaining.length > 0) {
		if (remaining.length <= width) {
			chunks.push(remaining);
			break;
		}

		chunks.push(remaining.substring(0, width));
		remaining = remaining.substring(width);
	}

	return chunks;
}

/**
 * Pad text to specified width
 * @param text - Text to pad
 * @param width - Target width
 * @param align - Alignment ('left' | 'center' | 'right')
 * @param padChar - Character to use for padding
 * @returns Padded text
 */
export function padText(
	text: string,
	width: number,
	align: 'left' | 'center' | 'right' = 'left',
	padChar: string = ' ',
): string {
	const textWidth = measureTextWidth(text);
	if (textWidth >= width) return text;

	const padding = width - textWidth;

	switch (align) {
		case 'left':
			return text + padChar.repeat(padding);
		case 'right':
			return padChar.repeat(padding) + text;
		case 'center': {
			const leftPad = Math.floor(padding / 2);
			const rightPad = padding - leftPad;
			return padChar.repeat(leftPad) + text + padChar.repeat(rightPad);
		}
		default:
			return text;
	}
}

/**
 * Remove ANSI escape codes from text
 * @param text - Text with potential ANSI codes
 * @returns Clean text
 */
export function stripAnsi(text: string): string {
	if (!text) return '';

	// eslint-disable-next-line no-control-regex
	return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * Calculate number of lines needed to display text with wrapping
 * @param text - Text to display
 * @param width - Width to wrap at
 * @returns Number of lines
 */
export function calculateLineCount(text: string, width: number): number {
	if (!text) return 0;

	const lines = text.split('\n');
	let totalLines = 0;

	for (const line of lines) {
		const wrapped = wrapText(line, width);
		totalLines += wrapped.length;
	}

	return totalLines;
}
