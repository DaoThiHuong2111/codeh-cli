/**
 * Mock LLM API Server
 * Supports: Anthropic, OpenAI, Ollama, and Generic OpenAI-compatible APIs
 */

import express, {Express, Request, Response} from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import anthropicRouter from './routes/anthropic';
import openaiRouter from './routes/openai';
import ollamaRouter from './routes/ollama';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// ==========================================
// Middleware
// ==========================================

// Enable CORS for all origins (for testing)
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// HTTP request logging
app.use(morgan('dev'));

// ==========================================
// Routes
// ==========================================

// Health check
app.get('/', (req: Request, res: Response) => {
	res.json({
		name: 'LLM Mock Server',
		version: '1.0.0',
		status: 'running',
		providers: [
			{name: 'Anthropic', prefix: '/anthropic', streaming: true},
			{name: 'OpenAI', prefix: '/openai', streaming: true},
			{name: 'Ollama', prefix: '/ollama', streaming: true},
			{name: 'Generic', prefix: '/generic', streaming: true},
		],
		endpoints: {
			anthropic: {
				messages: 'POST /anthropic/v1/messages',
				models: 'GET /anthropic/v1/models',
			},
			openai: {
				chat: 'POST /openai/v1/chat/completions',
				models: 'GET /openai/v1/models',
			},
			ollama: {
				chat: 'POST /ollama/api/chat',
				tags: 'GET /ollama/api/tags',
				show: 'POST /ollama/api/show',
			},
			generic: {
				chat: 'POST /generic/v1/chat/completions',
				models: 'GET /generic/v1/models',
			},
		},
		documentation: 'See README.md for usage examples',
	});
});

// Health endpoint
app.get('/health', (req: Request, res: Response) => {
	res.json({status: 'healthy', uptime: process.uptime()});
});

// Provider routes
app.use('/anthropic', anthropicRouter);
app.use('/openai', openaiRouter);
app.use('/ollama', ollamaRouter);
app.use('/generic', openaiRouter); // Generic uses OpenAI-compatible format

// ==========================================
// Error Handling
// ==========================================

// 404 handler
app.use((req: Request, res: Response) => {
	res.status(404).json({
		error: 'Not Found',
		message: `Route ${req.method} ${req.path} not found`,
		availableRoutes: [
			'/anthropic/v1/messages',
			'/openai/v1/chat/completions',
			'/ollama/api/chat',
			'/generic/v1/chat/completions',
		],
	});
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
	console.error('Error:', err);
	res.status(500).json({
		error: 'Internal Server Error',
		message: err.message,
	});
});

// ==========================================
// Start Server
// ==========================================

app.listen(PORT, () => {
	console.log('');
	console.log('╔════════════════════════════════════════╗');
	console.log('║   LLM Mock Server Started              ║');
	console.log('╚════════════════════════════════════════╝');
	console.log('');
	console.log(`🚀 Server running on: http://localhost:${PORT}`);
	console.log('');
	console.log('📍 Available Endpoints:');
	console.log(`   Anthropic:  http://localhost:${PORT}/anthropic/v1/messages`);
	console.log(`   OpenAI:     http://localhost:${PORT}/openai/v1/chat/completions`);
	console.log(`   Ollama:     http://localhost:${PORT}/ollama/api/chat`);
	console.log(`   Generic:    http://localhost:${PORT}/generic/v1/chat/completions`);
	console.log('');
	console.log('📚 Documentation: http://localhost:${PORT}/');
	console.log('');
	console.log('⌨️  Press Ctrl+C to stop');
	console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM received, shutting down gracefully...');
	process.exit(0);
});

process.on('SIGINT', () => {
	console.log('\nSIGINT received, shutting down gracefully...');
	process.exit(0);
});
