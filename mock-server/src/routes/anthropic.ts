/**
 * Mock Anthropic Claude API endpoints
 * Format: https://docs.anthropic.com/en/api/messages
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
 * POST /v1/messages - Anthropic Messages API (streaming)
 */
router.post('/v1/messages', async (req: Request, res: Response) => {
	const {messages, stream = false, model = 'claude-3-5-sonnet-20241022'} = req.body;

	// Extract user message
	const userMessage = messages?.find((m: any) => m.role === 'user')?.content || '';
	const responseText = getMockResponse(userMessage);

	// Non-streaming response
	if (!stream) {
		const tokens = generateTokenCount(responseText);
		return res.json({
			id: `msg_${Date.now()}`,
			type: 'message',
			role: 'assistant',
			content: [
				{
					type: 'text',
					text: responseText,
				},
			],
			model,
			stop_reason: 'end_turn',
			stop_sequence: null,
			usage: {
				input_tokens: tokens.promptTokens,
				output_tokens: tokens.completionTokens,
			},
		});
	}

	// Streaming response (SSE)
	setupSSE(res);

	const messageId = `msg_${Date.now()}`;

	// Send message_start event
	sendSSEChunk(res, {
		type: 'message_start',
		message: {
			id: messageId,
			type: 'message',
			role: 'assistant',
			content: [],
			model,
			stop_reason: null,
			stop_sequence: null,
			usage: {
				input_tokens: 0,
				output_tokens: 0,
			},
		},
	});

	// Send content_block_start event
	sendSSEChunk(res, {
		type: 'content_block_start',
		index: 0,
		content_block: {
			type: 'text',
			text: '',
		},
	});

	// Stream text content
	await streamTextWordByWord(
		res,
		responseText,
		50, // 50ms delay between words
		(content, index, isLast) => ({
			type: 'content_block_delta',
			index: 0,
			delta: {
				type: 'text_delta',
				text: content,
			},
		}),
	);

	// Send content_block_stop event
	sendSSEChunk(res, {
		type: 'content_block_stop',
		index: 0,
	});

	// Send message_delta event with final usage
	const tokens = generateTokenCount(responseText);
	sendSSEChunk(res, {
		type: 'message_delta',
		delta: {
			stop_reason: 'end_turn',
			stop_sequence: null,
		},
		usage: {
			output_tokens: tokens.completionTokens,
		},
	});

	// Send message_stop event
	sendSSEChunk(res, {
		type: 'message_stop',
	});

	// End stream
	sendSSEDone(res);
});

/**
 * GET /v1/models - List available models
 */
router.get('/v1/models', (req: Request, res: Response) => {
	res.json({
		data: [
			{id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet'},
			{id: 'claude-3-opus-20240229', name: 'Claude 3 Opus'},
			{id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet'},
			{id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku'},
		],
	});
});

export default router;
