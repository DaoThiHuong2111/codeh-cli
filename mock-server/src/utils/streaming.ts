/**
 * Streaming utilities for SSE (Server-Sent Events)
 */

import type {Response} from 'express';

/**
 * Setup SSE headers for streaming response
 */
export function setupSSE(res: Response): void {
	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');
	res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
	res.flushHeaders();
}

/**
 * Send SSE data chunk
 */
export function sendSSEChunk(res: Response, data: any): void {
	res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Send SSE done signal
 */
export function sendSSEDone(res: Response): void {
	res.write('data: [DONE]\n\n');
	res.end();
}

/**
 * Stream text word by word with delay
 */
export async function streamTextWordByWord(
	res: Response,
	text: string,
	delayMs: number = 50,
	formatChunk: (word: string, index: number, isLast: boolean) => any,
): Promise<void> {
	const words = text.split(' ');

	for (let i = 0; i < words.length; i++) {
		const word = words[i];
		const isLast = i === words.length - 1;
		const content = isLast ? word : `${word} `;

		const chunk = formatChunk(content, i, isLast);
		sendSSEChunk(res, chunk);

		// Add delay between words
		if (!isLast) {
			await sleep(delayMs);
		}
	}
}

/**
 * Sleep helper
 */
export function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random token count
 */
export function generateTokenCount(text: string): {
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
} {
	const wordCount = text.split(' ').length;
	const promptTokens = Math.floor(wordCount * 0.3);
	const completionTokens = Math.floor(wordCount * 1.3);

	return {
		promptTokens,
		completionTokens,
		totalTokens: promptTokens + completionTokens,
	};
}
