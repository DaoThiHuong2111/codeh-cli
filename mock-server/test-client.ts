/**
 * Test client for mock server
 * Run with: npx ts-node test-client.ts
 */

async function testAnthropicStreaming() {
	console.log('🧪 Testing Anthropic Streaming...\n');

	const response = await fetch('http://localhost:3001/anthropic/v1/messages', {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({
			messages: [{role: 'user', content: 'Show me code'}],
			model: 'claude-3-5-sonnet-20241022',
			stream: true,
		}),
	});

	if (!response.ok || !response.body) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let accumulatedContent = '';

	console.log('📡 Receiving stream...\n');

	while (true) {
		const {done, value} = await reader.read();
		if (done) break;

		const chunk = decoder.decode(value, {stream: true});
		const lines = chunk.split('\n');

		for (const line of lines) {
			if (line.startsWith('data: ')) {
				const dataStr = line.slice(6);

				if (dataStr === '[DONE]') {
					console.log('\n✅ Stream complete!');
					break;
				}

				try {
					const data = JSON.parse(dataStr);

					if (data.type === 'content_block_delta' && data.delta?.text) {
						process.stdout.write(data.delta.text);
						accumulatedContent += data.delta.text;
					}
				} catch (e) {
					// Ignore parse errors
				}
			}
		}
	}

	console.log('\n\n📊 Stats:');
	console.log(`   Words: ${accumulatedContent.split(' ').length}`);
	console.log(`   Characters: ${accumulatedContent.length}`);
	console.log('');
}

async function testOpenAIStreaming() {
	console.log('🧪 Testing OpenAI Streaming...\n');

	const response = await fetch(
		'http://localhost:3001/openai/v1/chat/completions',
		{
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({
				messages: [{role: 'user', content: 'Show me markdown'}],
				model: 'gpt-4-turbo-preview',
				stream: true,
			}),
		},
	);

	if (!response.ok || !response.body) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let accumulatedContent = '';

	console.log('📡 Receiving stream...\n');

	while (true) {
		const {done, value} = await reader.read();
		if (done) break;

		const chunk = decoder.decode(value, {stream: true});
		const lines = chunk.split('\n');

		for (const line of lines) {
			if (line.startsWith('data: ')) {
				const dataStr = line.slice(6);

				if (dataStr === '[DONE]') {
					console.log('\n✅ Stream complete!');
					break;
				}

				try {
					const data = JSON.parse(dataStr);
					const content = data.choices?.[0]?.delta?.content;

					if (content) {
						process.stdout.write(content);
						accumulatedContent += content;
					}
				} catch (e) {
					// Ignore parse errors
				}
			}
		}
	}

	console.log('\n\n📊 Stats:');
	console.log(`   Words: ${accumulatedContent.split(' ').length}`);
	console.log(`   Characters: ${accumulatedContent.length}`);
	console.log('');
}

async function testOllamaStreaming() {
	console.log('🧪 Testing Ollama Streaming...\n');

	const response = await fetch('http://localhost:3001/ollama/api/chat', {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({
			messages: [{role: 'user', content: 'Hello!'}],
			model: 'llama2',
			stream: true,
		}),
	});

	if (!response.ok || !response.body) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let accumulatedContent = '';

	console.log('📡 Receiving stream...\n');

	while (true) {
		const {done, value} = await reader.read();
		if (done) break;

		const chunk = decoder.decode(value, {stream: true});
		const lines = chunk.split('\n').filter(line => line.trim());

		for (const line of lines) {
			try {
				const data = JSON.parse(line);
				const content = data.message?.content;

				if (content) {
					process.stdout.write(content);
					accumulatedContent += content;
				}

				if (data.done) {
					console.log('\n✅ Stream complete!');
				}
			} catch (e) {
				// Ignore parse errors
			}
		}
	}

	console.log('\n\n📊 Stats:');
	console.log(`   Words: ${accumulatedContent.split(' ').length}`);
	console.log(`   Characters: ${accumulatedContent.length}`);
	console.log('');
}

async function testHealthCheck() {
	console.log('🏥 Testing Health Check...\n');

	const response = await fetch('http://localhost:3001/health');
	const data = await response.json();

	console.log('   Status:', data.status);
	console.log('   Uptime:', Math.floor(data.uptime), 'seconds');
	console.log('');
}

async function main() {
	console.log('');
	console.log('╔════════════════════════════════════════╗');
	console.log('║   LLM Mock Server Test Client          ║');
	console.log('╚════════════════════════════════════════╝');
	console.log('');

	try {
		// Health check
		await testHealthCheck();

		// Test Anthropic
		await testAnthropicStreaming();
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Test OpenAI
		await testOpenAIStreaming();
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Test Ollama
		await testOllamaStreaming();

		console.log('✅ All tests passed!\n');
	} catch (error) {
		console.error('\n Test failed:', error);
		process.exit(1);
	}
}

// Run if executed directly
if (require.main === module) {
	main().catch(console.error);
}
