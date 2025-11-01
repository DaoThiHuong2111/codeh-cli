import {inputValidator} from './validator.js';
import {outputClassifier} from '../output/classifier.js';
import {apiManager} from '../api/manager.js';

class InputHandler {
	constructor() {
		this.history = [];
		this.maxHistorySize = 100;
	}

	// Xử lý input từ người dùng
	async processInput(input) {
		try {
			// Validate input
			const validation = inputValidator.validate(input);
			if (!validation.valid) {
				return {
					success: false,
					type: 'error',
					content: `Input không hợp lệ: ${validation.errors.join(', ')}`,
					classification: validation.classification,
					warnings: validation.warnings,
				};
			}

			// Thêm vào history
			this.addToHistory(input);

			// Xử lý theo loại input
			switch (validation.classification) {
				case 'command':
					return await this.handleCommand(input);
				case 'code':
					return await this.handleCode(input);
				case 'url':
					return await this.handleUrl(input);
				case 'file':
					return await this.handleFile(input);
				default:
					return await this.handleText(input);
			}
		} catch (error) {
			return {
				success: false,
				type: 'error',
				content: `Lỗi xử lý input: ${error.message}`,
				classification: 'error',
			};
		}
	}

	// Xử lý command
	async handleCommand(input) {
		try {
			// Phân tích command
			const [command, ...args] = input.trim().split(' ');

			// Xử lý các command thông dụng
			switch (command) {
				case 'git':
					return await this.handleGitCommand(args);
				case 'npm':
					return await this.handleNpmCommand(args);
				case 'ls':
				case 'dir':
					return await this.handleListCommand(args);
				case 'cat':
				case 'type':
					return await this.handleReadFileCommand(args);
				default:
					return await this.executeCommand(input);
			}
		} catch (error) {
			return {
				success: false,
				type: 'error',
				content: `Lỗi thực thi command: ${error.message}`,
				classification: 'command',
			};
		}
	}

	// Xử lý code
	async handleCode(input) {
		try {
			// Gửi code đến AI để phân tích hoặc xử lý
			const response = await apiManager.callAI({
				messages: [
					{
						role: 'user',
						content: `Phân tích hoặc giúp tôi với đoạn code sau:\n\n${input}`,
					},
				],
				type: 'code_analysis',
			});

			return {
				success: true,
				type: 'code',
				content: response.content,
				classification: 'code',
				metadata: {
					language: this.detectCodeLanguage(input),
					analysis: response.metadata,
				},
			};
		} catch (error) {
			return {
				success: false,
				type: 'error',
				content: `Lỗi xử lý code: ${error.message}`,
				classification: 'code',
			};
		}
	}

	// Xử lý URL
	async handleUrl(input) {
		try {
			const response = await apiManager.fetchUrl(input);

			return {
				success: true,
				type: 'url',
				content: `Nội dung từ ${input}:\n\n${response.content}`,
				classification: 'url',
				metadata: {
					url: input,
					statusCode: response.statusCode,
					contentType: response.contentType,
				},
			};
		} catch (error) {
			return {
				success: false,
				type: 'error',
				content: `Lỗi truy cập URL: ${error.message}`,
				classification: 'url',
			};
		}
	}

	// Xử lý file path
	async handleFile(input) {
		try {
			const fs = await import('fs/promises');
			const path = await import('path');

			// Normalize path
			const normalizedPath = path.normalize(input);

			// Check if file exists
			try {
				const stats = await fs.stat(normalizedPath);

				if (stats.isDirectory()) {
					const files = await fs.readdir(normalizedPath);
					return {
						success: true,
						type: 'directory',
						content: `Thư mục ${normalizedPath} chứa:\n${files.join('\n')}`,
						classification: 'file',
						metadata: {
							path: normalizedPath,
							type: 'directory',
							itemCount: files.length,
						},
					};
				} else {
					const content = await fs.readFile(normalizedPath, 'utf8');
					const classification = outputClassifier.classify(content);

					return {
						success: true,
						type: classification.type,
						content: `Nội dung file ${normalizedPath}:\n\n${content}`,
						classification: classification.type,
						metadata: {
							path: normalizedPath,
							type: 'file',
							size: stats.size,
							contentType: classification.type,
						},
					};
				}
			} catch (statError) {
				return {
					success: false,
					type: 'error',
					content: `File không tồn tại hoặc không thể truy cập: ${normalizedPath}`,
					classification: 'file',
				};
			}
		} catch (error) {
			return {
				success: false,
				type: 'error',
				content: `Lỗi xử lý file: ${error.message}`,
				classification: 'file',
			};
		}
	}

	// Xử lý text thông thường
	async handleText(input) {
		try {
			const response = await apiManager.callAI({
				messages: [
					{
						role: 'user',
						content: input,
					},
				],
				type: 'chat',
			});

			return {
				success: true,
				type: 'text',
				content: response.content,
				classification: 'text',
				metadata: response.metadata,
			};
		} catch (error) {
			return {
				success: false,
				type: 'error',
				content: `Lỗi xử lý text: ${error.message}`,
				classification: 'text',
			};
		}
	}

	// Phát hiện ngôn ngữ lập trình
	detectCodeLanguage(code) {
		const patterns = {
			javascript: [/function\s+\w+/, /const\s+\w+\s*=/, /=>/, /import\s+from/],
			python: [
				/def\s+\w+\s*\(/,
				/import\s+\w+/,
				/print\s*\(/,
				/if\s+__name__\s*==/,
			],
			java: [/public\s+class/, /public\s+static\s+void\s+main/],
			typescript: [/interface\s+\w+/, /type\s+\w+\s*=/, /:\s*string/],
			html: [/<html/, /<div/, /<p>/],
			css: [/\{\s*[\w-]+:/, /\.[\w-]+\s*\{/, /#[\w-]+\s*\{/],
			json: [/^\s*\{/, /^\s*\[/],
			sql: [/SELECT\s+/, /INSERT\s+INTO/, /CREATE\s+TABLE/],
			bash: [/^#!/, /\$\{?/, /&&\s*|\|\|/],
		};

		for (const [language, langPatterns] of Object.entries(patterns)) {
			if (langPatterns.some(pattern => pattern.test(code))) {
				return language;
			}
		}

		return 'unknown';
	}

	// Thêm vào history
	addToHistory(input) {
		this.history.unshift({
			input,
			timestamp: new Date().toISOString(),
			classification: inputValidator.classifyInput(input),
		});

		// Giới hạn kích thước history
		if (this.history.length > this.maxHistorySize) {
			this.history = this.history.slice(0, this.maxHistorySize);
		}
	}

	// Lấy history
	getHistory(limit = 10) {
		return this.history.slice(0, limit);
	}

	// Xóa history
	clearHistory() {
		this.history = [];
	}

	// Placeholder methods cho các command handlers
	async handleGitCommand(args) {
		return await this.executeCommand(`git ${args.join(' ')}`);
	}

	async handleNpmCommand(args) {
		return await this.executeCommand(`npm ${args.join(' ')}`);
	}

	async handleListCommand(args) {
		return await this.executeCommand(`ls ${args.join(' ')}`);
	}

	async handleReadFileCommand(args) {
		return await this.handleFile(args.join(' '));
	}

	async executeCommand(command) {
		const {exec} = await import('child_process');
		const {promisify} = await import('util');
		const execAsync = promisify(exec);

		try {
			const {stdout, stderr} = await execAsync(command);
			const output = stdout || stderr;

			const classification = outputClassifier.classify(output);

			return {
				success: true,
				type: classification.type,
				content: output,
				classification: classification.type,
				metadata: {
					command,
					classification: classification.metadata,
				},
			};
		} catch (error) {
			return {
				success: false,
				type: 'error',
				content: `Command failed: ${error.message}`,
				classification: 'command',
			};
		}
	}
}

export const inputHandler = new InputHandler();

// Export function để sử dụng trong components
export async function processUserInput(input) {
	return await inputHandler.processInput(input);
}

export default inputHandler;
