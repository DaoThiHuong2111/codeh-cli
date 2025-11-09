/**
 * Mock Ollama API endpoints
 * Format: https://github.com/ollama/ollama/blob/main/docs/api.md
 */

import {Router, Request, Response} from 'express';
import {
	setupSSE,
	sendSSEChunk,
	streamTextWordByWord,
	generateTokenCount,
} from '../utils/streaming';
import {getMockResponse} from '../mock-data/responses';

const router = Router();

/**
 * POST /api/chat - Ollama Chat API
 */
router.post('/api/chat', async (req: Request, res: Response) => {
	const {messages, stream = false, model = 'llama2'} = req.body;

	// Extract user message
	const userMessage =
		messages?.find((m: any) => m.role === 'user')?.content || '';
	const responseText = getMockResponse(userMessage);

	// Non-streaming response
	if (!stream) {
		const tokens = generateTokenCount(responseText);
		return res.json({
			model,
			created_at: new Date().toISOString(),
			message: {
				role: 'assistant',
				content: responseText,
			},
			done: true,
			total_duration: 1234567890,
			load_duration: 123456789,
			prompt_eval_count: tokens.promptTokens,
			prompt_eval_duration: 12345678,
			eval_count: tokens.completionTokens,
			eval_duration: 123456789,
		});
	}

	// Streaming response (newline-delimited JSON)
	res.setHeader('Content-Type', 'application/x-ndjson');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');

	// Stream text content
	await streamTextWordByWord(
		res,
		responseText,
		50, // 50ms delay between words
		(content, index, isLast) => {
			const chunk = {
				model,
				created_at: new Date().toISOString(),
				message: {
					role: 'assistant',
					content,
				},
				done: isLast,
			};

			// For Ollama, send newline-delimited JSON
			res.write(JSON.stringify(chunk) + '\n');

			return chunk;
		},
	);

	// Send final message with done=true and stats
	const tokens = generateTokenCount(responseText);
	const finalChunk = {
		model,
		created_at: new Date().toISOString(),
		message: {
			role: 'assistant',
			content: '',
		},
		done: true,
		total_duration: 1234567890,
		load_duration: 123456789,
		prompt_eval_count: tokens.promptTokens,
		prompt_eval_duration: 12345678,
		eval_count: tokens.completionTokens,
		eval_duration: 123456789,
	};

	res.write(JSON.stringify(finalChunk) + '\n');
	res.end();
});

/**
 * GET /api/tags - List available models
 */
router.get('/api/tags', (req: Request, res: Response) => {
	res.json({
		models: [
			{name: 'llama2', size: 3825819519},
			{name: 'mistral', size: 4109865159},
			{name: 'codellama', size: 3791749063},
		],
	});
});

/**
 * POST /api/show - Show model information
 */
router.post('/api/show', (req: Request, res: Response) => {
	const {name} = req.body;
	res.json({
		modelfile: `# Modelfile for ${name}`,
		parameters: {},
		template: '',
		details: {
			format: 'gguf',
			family: 'llama',
			families: ['llama'],
			parameter_size: '7B',
			quantization_level: 'Q4_0',
		},
	});
});

export default router;
