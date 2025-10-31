import {envManager} from './envManager.js';
import {outputClassifier} from './outputClassifier.js';

class ApiManager {
	constructor() {
		this.requestHistory = [];
		this.maxHistorySize = 100;
		this.hooks = {
			beforeRequest: [],
			afterRequest: [],
			onError: [],
			onSuccess: [],
		};
		this.rateLimiter = {
			requests: [],
			maxRequests: 60,
			timeWindow: 60000, // 1 minute
		};
	}

	// Thêm hook
	addHook(type, callback) {
		if (this.hooks[type]) {
			this.hooks[type].push(callback);
		}
	}

	// Xóa hook
	removeHook(type, callback) {
		if (this.hooks[type]) {
			const index = this.hooks[type].indexOf(callback);
			if (index > -1) {
				this.hooks[type].splice(index, 1);
			}
		}
	}

	// Execute hooks
	async executeHooks(type, data) {
		if (!this.hooks[type]) return data;

		let result = data;
		for (const hook of this.hooks[type]) {
			try {
				result = (await hook(result)) || result;
			} catch (error) {
				console.error(`Hook error (${type}):`, error.message);
			}
		}
		return result;
	}

	// Check rate limiting
	checkRateLimit() {
		const now = Date.now();
		this.rateLimiter.requests = this.rateLimiter.requests.filter(
			timestamp => now - timestamp < this.rateLimiter.timeWindow,
		);

		if (this.rateLimiter.requests.length >= this.rateLimiter.maxRequests) {
			const oldestRequest = Math.min(...this.rateLimiter.requests);
			const waitTime = this.rateLimiter.timeWindow - (now - oldestRequest);
			throw new Error(
				`Rate limit exceeded. Please wait ${Math.ceil(
					waitTime / 1000,
				)} seconds.`,
			);
		}

		this.rateLimiter.requests.push(now);
	}

	// Gọi API AI
	async callAI({messages, type = 'chat', options = {}}) {
		const requestId = this.generateRequestId();
		const startTime = Date.now();

		const requestData = {
			id: requestId,
			type,
			messages,
			options,
			timestamp: new Date().toISOString(),
			provider: envManager.modelConfig.provider,
		};

		try {
			// Execute before hooks
			const processedData = await this.executeHooks(
				'beforeRequest',
				requestData,
			);

			// Check rate limit
			this.checkRateLimit();

			// Get provider config
			const config = envManager.modelConfig;

			// Make API call based on provider
			let response;
			switch (config.provider) {
				case 'anthropic':
					response = await this.callAnthropic(processedData, config);
					break;
				case 'openai':
					response = await this.callOpenAI(processedData, config);
					break;
				case 'ollama':
					response = await this.callOllama(processedData, config);
					break;
				case 'generic-chat-completion-api':
					response = await this.callGenericAPI(processedData, config);
					break;
				default:
					throw new Error(`Unsupported provider: ${config.provider}`);
			}

			// Process response
			const processedResponse = await this.processResponse(
				response,
				processedData,
			);

			// Execute after hooks
			const finalResponse = await this.executeHooks(
				'afterRequest',
				processedResponse,
			);

			// Add to history
			this.addToHistory({
				...requestData,
				response: finalResponse,
				duration: Date.now() - startTime,
				success: true,
			});

			// Execute success hooks
			await this.executeHooks('onSuccess', finalResponse);

			return finalResponse;
		} catch (error) {
			const errorData = {
				...requestData,
				error: {
					message: error.message,
					stack: error.stack,
					code: error.code,
				},
				duration: Date.now() - startTime,
				success: false,
			};

			// Add to history
			this.addToHistory(errorData);

			// Execute error hooks
			await this.executeHooks('onError', errorData);

			throw error;
		}
	}

	// Gọi Anthropic API
	async callAnthropic(data, config) {
		const fetch = await import('node-fetch').then(m => m.default);

		const requestBody = {
			model: config.model,
			max_tokens: config.maxTokens,
			messages: data.messages,
		};

		const response = await fetch(config.baseUrl + '/v1/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': config.apiKey,
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify(requestBody),
			timeout: config.timeout,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Anthropic API error: ${response.status} - ${
					errorData.error?.message || response.statusText
				}`,
			);
		}

		return await response.json();
	}

	// Gọi OpenAI API
	async callOpenAI(data, config) {
		const fetch = await import('node-fetch').then(m => m.default);

		const requestBody = {
			model: config.model,
			max_tokens: config.maxTokens,
			messages: data.messages,
		};

		const response = await fetch(config.baseUrl + '/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${config.apiKey}`,
			},
			body: JSON.stringify(requestBody),
			timeout: config.timeout,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`OpenAI API error: ${response.status} - ${
					errorData.error?.message || response.statusText
				}`,
			);
		}

		return await response.json();
	}

	// Gọi Ollama API
	async callOllama(data, config) {
		const fetch = await import('node-fetch').then(m => m.default);

		const requestBody = {
			model: config.model,
			stream: false,
			messages: data.messages,
		};

		const url = config.baseUrl.replace(/\/$/, '') + '/api/chat';
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestBody),
			timeout: config.timeout,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Ollama API error: ${response.status} - ${
					errorData.error || response.statusText
				}`,
			);
		}

		return await response.json();
	}

	// Gọi Generic Chat Completion API
	async callGenericAPI(data, config) {
		const fetch = await import('node-fetch').then(m => m.default);

		const requestBody = {
			model: config.model,
			messages: data.messages,
			max_tokens: config.maxTokens,
			stream: false,
		};

		// Try OpenAI-compatible format first
		const url = config.baseUrl.replace(/\/$/, '') + '/chat/completions';
		const headers = {
			'Content-Type': 'application/json',
		};

		// Add authorization header if API key is provided
		if (config.apiKey) {
			headers['Authorization'] = `Bearer ${config.apiKey}`;
		}

		const response = await fetch(url, {
			method: 'POST',
			headers,
			body: JSON.stringify(requestBody),
			timeout: config.timeout,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Generic API error: ${response.status} - ${
					errorData.error?.message || response.statusText
				}`,
			);
		}

		const responseData = await response.json();

		// Try to normalize response format to OpenAI-compatible format
		if (responseData.choices && responseData.choices[0]?.message?.content) {
			// Already in OpenAI format
			return responseData;
		} else if (responseData.content) {
			// Convert to OpenAI format
			return {
				choices: [
					{
						message: {
							content: responseData.content,
							role: 'assistant',
						},
						finish_reason: responseData.stop_reason || 'stop',
					},
				],
				usage: responseData.usage || {
					prompt_tokens: 0,
					completion_tokens: 0,
					total_tokens: 0,
				},
				model: config.model,
			};
		} else {
			// Return as-is if format is unknown
			return responseData;
		}
	}

	// Xử lý response từ các provider
	async processResponse(response, requestData) {
		let content;
		let metadata = {};

		switch (requestData.provider) {
			case 'anthropic':
				content = response.content?.[0]?.text || '';
				metadata = {
					usage: response.usage,
					model: response.model,
					stopReason: response.stop_reason,
				};
				break;

			case 'openai':
				content = response.choices?.[0]?.message?.content || '';
				metadata = {
					usage: response.usage,
					model: response.model,
					finishReason: response.choices?.[0]?.finish_reason,
				};
				break;

			case 'ollama':
				content = response.message?.content || '';
				metadata = {
					model: response.model,
					done: response.done,
					totalDuration: response.total_duration,
					promptEvalCount: response.prompt_eval_count,
				};
				break;

			case 'generic-chat-completion-api':
				// Generic API should be normalized to OpenAI format in callGenericAPI
				content =
					response.choices?.[0]?.message?.content || response.content || '';
				metadata = {
					model: response.model,
					usage: response.usage,
					finishReason:
						response.choices?.[0]?.finish_reason || response.stop_reason,
				};
				break;

			default:
				content = JSON.stringify(response);
		}

		// Classify the response content
		const classification = outputClassifier.classify(content);

		return {
			requestId: requestData.id,
			content,
			classification: classification.type,
			metadata: {
				...metadata,
				provider: requestData.provider,
				model: envManager.modelConfig.model,
				timestamp: new Date().toISOString(),
				outputClassification: classification,
			},
		};
	}

	// Fetch URL
	async fetchUrl(url) {
		const requestId = this.generateRequestId();
		const startTime = Date.now();

		const requestData = {
			id: requestId,
			url,
			type: 'url_fetch',
			timestamp: new Date().toISOString(),
		};

		try {
			// Execute before hooks
			const processedData = await this.executeHooks(
				'beforeRequest',
				requestData,
			);

			const fetch = await import('node-fetch').then(m => m.default);

			const response = await fetch(url, {
				method: 'GET',
				timeout: 30000,
				headers: {
					'User-Agent': 'CodeH-CLI/1.0',
				},
			});

			const content = await response.text();
			const classification = outputClassifier.classify(content);

			const result = {
				requestId: processedData.id,
				url: processedData.url,
				content,
				statusCode: response.status,
				contentType: response.headers.get('content-type'),
				classification: classification.type,
				metadata: {
					...classification.metadata,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					timestamp: new Date().toISOString(),
				},
			};

			// Add to history
			this.addToHistory({
				...processedData,
				response: result,
				duration: Date.now() - startTime,
				success: true,
			});

			return result;
		} catch (error) {
			const errorData = {
				...requestData,
				error: {
					message: error.message,
					stack: error.stack,
				},
				duration: Date.now() - startTime,
				success: false,
			};

			// Add to history
			this.addToHistory(errorData);

			// Execute error hooks
			await this.executeHooks('onError', errorData);

			throw error;
		}
	}

	// Generate request ID
	generateRequestId() {
		return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	// Add to history
	addToHistory(data) {
		this.requestHistory.unshift(data);

		if (this.requestHistory.length > this.maxHistorySize) {
			this.requestHistory = this.requestHistory.slice(0, this.maxHistorySize);
		}
	}

	// Get request history
	getHistory(limit = 10) {
		return this.requestHistory.slice(0, limit);
	}

	// Clear history
	clearHistory() {
		this.requestHistory = [];
	}

	// Get API statistics
	getStats() {
		const totalRequests = this.requestHistory.length;
		const successfulRequests = this.requestHistory.filter(
			req => req.success,
		).length;
		const failedRequests = totalRequests - successfulRequests;

		const averageDuration =
			totalRequests > 0
				? this.requestHistory.reduce((sum, req) => sum + req.duration, 0) /
				  totalRequests
				: 0;

		const providerStats = {};
		for (const req of this.requestHistory) {
			const provider = req.provider || 'unknown';
			providerStats[provider] = (providerStats[provider] || 0) + 1;
		}

		return {
			totalRequests,
			successfulRequests,
			failedRequests,
			successRate:
				totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
			averageDuration,
			providerStats,
			currentRateLimit: {
				used: this.rateLimiter.requests.length,
				max: this.rateLimiter.maxRequests,
				timeWindow: this.rateLimiter.timeWindow,
			},
		};
	}

	// Health check for all configured APIs
	async healthCheck() {
		const results = {};
		const config = envManager.modelConfig;

		if (config.provider === 'anthropic' && config.apiKey) {
			try {
				await this.callAnthropic(
					{
						messages: [{role: 'user', content: 'ping'}],
					},
					config,
				);
				results.anthropic = {status: 'healthy', message: 'API is responding'};
			} catch (error) {
				results.anthropic = {status: 'unhealthy', message: error.message};
			}
		}

		if (config.provider === 'openai' && config.apiKey) {
			try {
				await this.callOpenAI(
					{
						messages: [{role: 'user', content: 'ping'}],
					},
					config,
				);
				results.openai = {status: 'healthy', message: 'API is responding'};
			} catch (error) {
				results.openai = {status: 'unhealthy', message: error.message};
			}
		}

		if (config.provider === 'ollama' && config.baseUrl) {
			try {
				await this.callOllama(
					{
						messages: [{role: 'user', content: 'ping'}],
					},
					config,
				);
				results.ollama = {status: 'healthy', message: 'API is responding'};
			} catch (error) {
				results.ollama = {status: 'unhealthy', message: error.message};
			}
		}

		if (config.provider === 'generic-chat-completion-api' && config.baseUrl) {
			try {
				await this.callGenericAPI(
					{
						messages: [{role: 'user', content: 'ping'}],
					},
					config,
				);
				results['generic-chat-completion-api'] = {
					status: 'healthy',
					message: 'API is responding',
				};
			} catch (error) {
				results['generic-chat-completion-api'] = {
					status: 'unhealthy',
					message: error.message,
				};
			}
		}

		return results;
	}
}

export const apiManager = new ApiManager();

// Built-in hooks for logging
apiManager.addHook('beforeRequest', async data => {
	if (envManager.logLevel === 'debug') {
		console.log(`[API] Starting request ${data.id} to ${data.provider}`);
	}
	return data;
});

apiManager.addHook('afterRequest', async data => {
	if (envManager.logLevel === 'debug') {
		console.log(`[API] Completed request ${data.id} in ${data.duration}ms`);
	}
	return data;
});

apiManager.addHook('onError', async data => {
	if (envManager.logLevel !== 'silent') {
		console.error(`[API] Request ${data.id} failed: ${data.error.message}`);
	}
	return data;
});

export default apiManager;
