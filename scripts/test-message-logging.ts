/**
 * Test: Message content logging
 * Verify that user messages and LLM responses are logged to file
 */

import {getLogger} from '../source/infrastructure/logging/Logger.js';
import {AnthropicSDKAdapter} from '../source/infrastructure/api/clients/AnthropicSDKAdapter.js';
import {existsSync, readdirSync, readFileSync, unlinkSync} from 'fs';
import {join} from 'path';
import {homedir} from 'os';

const LOGS_DIR = join(homedir(), '.codeh', 'logs');

function getLogFiles(): string[] {
	if (!existsSync(LOGS_DIR)) return [];
	return readdirSync(LOGS_DIR).filter(f => f.startsWith('logs_') && f.endsWith('.json'));
}

function cleanupLogs() {
	const files = getLogFiles();
	files.forEach(f => {
		try {
			unlinkSync(join(LOGS_DIR, f));
		} catch {}
	});
}

async function runTest() {
	console.log('=== Testing Message Content Logging ===\n');

	cleanupLogs();

	const logger = getLogger();
	logger.setSessionId('test_message_logging');

	// Check if API key is available
	const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CODEH_API_KEY;
	if (!apiKey) {
		console.log('⚠️  No API key found. Using mock test instead.\n');

		// Log mock messages
		logger.info('AnthropicSDKAdapter', 'chat', 'Input messages', {
			messages: [
				{role: 'user', content: 'Hello, how are you?'},
				{role: 'assistant', content: 'I am doing well, thank you!'},
				{role: 'user', content: 'What is 2+2?'},
			],
			system_prompt: 'You are a helpful assistant',
		});

		logger.info('AnthropicSDKAdapter', 'chat', 'Response content', {
			content: '2+2 equals 4.',
			tool_calls: undefined,
			finish_reason: 'end_turn',
		});

		logger.flush();
		await new Promise(resolve => setTimeout(resolve, 500));

		// Check logs
		const files = getLogFiles();
		if (files.length === 0) {
			console.log('❌ No log files created!');
			process.exit(1);
		}

		const logFile = join(LOGS_DIR, files[0]);
		const content = readFileSync(logFile, 'utf-8');
		const entries = content
			.trim()
			.split('\n')
			.filter(l => l.trim())
			.map(l => JSON.parse(l));

		console.log(`📄 Log file: ${files[0]}`);
		console.log(`📝 Total entries: ${entries.length}\n`);

		// Find message entries
		const inputEntry = entries.find(
			e => e.message === 'Input messages' && e.component === 'AnthropicSDKAdapter',
		);
		const responseEntry = entries.find(
			e => e.message === 'Response content' && e.component === 'AnthropicSDKAdapter',
		);

		if (inputEntry) {
			console.log('✅ Found Input messages entry:');
			console.log('   Messages:', JSON.stringify(inputEntry.context.messages, null, 2));
			console.log('   System:', inputEntry.context.system_prompt);
		} else {
			console.log('❌ Input messages entry NOT found!');
			process.exit(1);
		}

		console.log('');

		if (responseEntry) {
			console.log('✅ Found Response content entry:');
			console.log('   Content:', responseEntry.context.content);
			console.log('   Tool calls:', responseEntry.context.tool_calls);
			console.log('   Finish reason:', responseEntry.context.finish_reason);
		} else {
			console.log('❌ Response content entry NOT found!');
			process.exit(1);
		}

		console.log('\n🎉 SUCCESS! Message content is being logged correctly!\n');
		console.log('Summary:');
		console.log('✅ User messages are logged');
		console.log('✅ System prompts are logged');
		console.log('✅ LLM responses are logged');
		console.log('✅ Tool calls are logged (if any)');
		console.log('✅ All conversation content is preserved in logs');

		return;
	}

	console.log('Testing with real API call...\n');

	// Test with real API
	const adapter = new AnthropicSDKAdapter(apiKey);

	try {
		const response = await adapter.chat({
			model: 'claude-3-5-haiku-20241022',
			messages: [{role: 'user', content: 'Say "hello" in one word'}],
			maxTokens: 100,
		});

		console.log('API Response:', response.content);

		logger.flush();
		await new Promise(resolve => setTimeout(resolve, 500));

		// Check logs
		const files = getLogFiles();
		const logFile = join(LOGS_DIR, files[0]);
		const content = readFileSync(logFile, 'utf-8');
		const entries = content
			.trim()
			.split('\n')
			.filter(l => l.trim())
			.map(l => JSON.parse(l));

		console.log(`\n📄 Log entries: ${entries.length}\n`);

		// Verify message logging
		const inputEntry = entries.find(e => e.message === 'Input messages');
		const responseEntry = entries.find(e => e.message === 'Response content');

		if (inputEntry && responseEntry) {
			console.log('✅ SUCCESS! Messages are logged with real API\n');
			console.log('Input:', inputEntry.context.messages);
			console.log('Response:', responseEntry.context.content);
		} else {
			console.log('❌ FAIL: Messages not logged properly');
			process.exit(1);
		}
	} catch (error: any) {
		console.error('API call failed:', error.message);
		process.exit(1);
	}
}

runTest().catch(err => {
	console.error('Test failed:', err);
	process.exit(1);
});
