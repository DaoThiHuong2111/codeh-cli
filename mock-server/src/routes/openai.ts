/**
 * Mock OpenAI API endpoints
 * Format: https://platform.openai.com/docs/api-reference/chat
 */

import {Router, Request, Response} from 'express';
import {
	setupSSE,
	sendSSEChunk,
	sendSSEDone,
	streamTextWordByWord,
	generateTokenCount,
} from '../utils/streaming';
import {getMockResponse} from '../mock-data/responses';

const router = Router();

/**
 * POST /v1/chat/completions - OpenAI Chat Completions API
 */
router.post('/v1/chat/completions', async (req: Request, res: Response) => {
	const {
		messages,
		stream = false,
		model = 'gpt-4-turbo-preview',
	} = req.body;

	// Extract user message
	const userMessage =
		messages?.find((m: any) => m.role === 'user')?.content || '';
	const responseText = getMockResponse(userMessage);

	// Non-streaming response
	if (!stream) {
		const tokens = generateTokenCount(responseText);
		return res.json({
			id: `chatcmpl_${Date.now()}`,
			object: 'chat.completion',
			created: Math.floor(Date.now() / 1000),
			model,
			choices: [
				{
					index: 0,
					message: {
						role: 'assistant',
						content: responseText,
					},
					finish_reason: 'stop',
				},
			],
			usage: {
				prompt_tokens: tokens.promptTokens,
				completion_tokens: tokens.completionTokens,
				total_tokens: tokens.totalTokens,
			},
		});
	}

	// Streaming response (SSE)
	setupSSE(res);

	const chatId = `chatcmpl_${Date.now()}`;

	// Stream text content
	await streamTextWordByWord(
		res,
		responseText,
		50, // 50ms delay between words
		(content, index, isLast) => ({
			id: chatId,
			object: 'chat.completion.chunk',
			created: Math.floor(Date.now() / 1000),
			model,
			choices: [
				{
					index: 0,
					delta: {
						content,
					},
					finish_reason: isLast ? 'stop' : null,
				},
			],
		}),
	);

	// End stream
	sendSSEDone(res);
});

/**
 * GET /v1/models - List available models
 */
router.get('/v1/models', (req: Request, res: Response) => {
	res.json({
		data: [
			{id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo'},
			{id: 'gpt-4', name: 'GPT-4'},
			{id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo'},
		],
	});
});

export default router;
