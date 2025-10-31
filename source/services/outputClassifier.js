class OutputClassifier {
	constructor() {
		// Patterns để phân loại các loại output khác nhau
		this.patterns = {
			gitDiff: {
				name: 'git_diff',
				patterns: [
					/^diff --git/,
					/^index [a-f0-9]+/,
					/^\+\+\+ b\//,
					/^--- a\//,
					/^\+.*\n/,
					/^-.*\n/,
				],
				priority: 10,
			},
			commandOutput: {
				name: 'command_output',
				patterns: [
					/^\s*\w+@\w+:/, // bash prompt
					/^\$ /, // command prompt
					/^Error:/, // error messages
					/^Warning:/, // warning messages
					/^Usage:/, // usage info
					/^Command not found/,
					/^Permission denied/,
				],
				priority: 8,
			},
			codeBlock: {
				name: 'code',
				patterns: [
					/```[\s\S]*```/, // markdown code blocks
					/^\s*function\s+\w+/, // function definitions
					/^\s*class\s+\w+/, // class definitions
					/^\s*const\s+\w+\s*=/, // const declarations
					/^\s*let\s+\w+\s*=/, // let declarations
					/^\s*var\s+\w+\s*=/, // var declarations
					/^\s*import\s+/, // import statements
					/^\s*export\s+/, // export statements
					/\{\s*[\s\S]*\s*\}/, // code blocks
					/\(.*\)\s*=>/, // arrow functions
				],
				priority: 9,
			},
			jsonOutput: {
				name: 'json',
				patterns: [
					/^\s*\{[\s\S]*\}\s*$/, // complete JSON object
					/^\s*\[[\s\S]*\]\s*$/, // complete JSON array
					/"\w+"\s*:/, // JSON key-value pairs
					/^\s*\{\s*"\w+"/, // JSON object start
				],
				priority: 7,
			},
			errorMessage: {
				name: 'error',
				patterns: [
					/^Error:/i,
					/^TypeError:/i,
					/^ReferenceError:/i,
					/^SyntaxError:/i,
					/^NetworkError:/i,
					/^Failed to/i,
					/^Cannot/i,
					/Exception:/i,
					/traceback/i,
					/at\s+.*\s*\(\d+:\d+\)/, // stack traces
				],
				priority: 11,
			},
			warningMessage: {
				name: 'warning',
				patterns: [
					/^Warning:/i,
					/^Caution:/i,
					/^Notice:/i,
					/^Deprecated:/i,
					/⚠/,
					/^⚠️/,
				],
				priority: 6,
			},
			successMessage: {
				name: 'success',
				patterns: [
					/^Success:/i,
					/^Completed:/i,
					/^Done:/i,
					/^Finished:/i,
					/^✓/,
					/^✅/,
					/^OK/i,
				],
				priority: 6,
			},
			urlList: {
				name: 'url_list',
				patterns: [/https?:\/\/[^\s]+/g, /www\.[^\s]+/g, /ftp:\/\/[^\s]+/g],
				priority: 5,
			},
			filePath: {
				name: 'file_path',
				patterns: [
					/\/[\w\-\.\/]+/g, // unix paths
					/[A-Za-z]:\\[\w\-\.\\]+/g, // windows paths
					/\.\/[\w\-\.\/]+/g, // relative paths
					/~\/[\w\-\.\/]+/g, // home paths
				],
				priority: 4,
			},
			listContent: {
				name: 'list',
				patterns: [
					/^\s*[-*+]\s+/m, // bullet points
					/^\s*\d+\.\s+/m, // numbered lists
					/^\s*•\s+/m, // fancy bullets
				],
				priority: 3,
			},
			table: {
				name: 'table',
				patterns: [
					/\|[^\n]+\|/g, // pipe-separated tables
					/^\s*\+[-+]+\+\s*$/m, // ASCII table borders
					/^\s*\|[\s\|]+\|\s*$/m, // table rows
				],
				priority: 5,
			},
		};
	}

	// Phân loại output
	classify(output) {
		const results = [];

		// Kiểm tra từng pattern
		for (const [type, config] of Object.entries(this.patterns)) {
			const matches = this.checkPatterns(output, config.patterns);

			if (matches.length > 0) {
				results.push({
					type: config.name,
					priority: config.priority,
					matches: matches,
					confidence: this.calculateConfidence(output, matches),
				});
			}
		}

		// Sắp xếp theo priority và confidence
		results.sort((a, b) => {
			if (a.priority !== b.priority) {
				return b.priority - a.priority; // cao hơn ưu tiên hơn
			}
			return b.confidence - a.confidence; // confidence cao hơn ưu tiên hơn
		});

		// Nếu không có pattern nào match, trả về text
		if (results.length === 0) {
			return {
				type: 'text',
				confidence: 1.0,
				metadata: {
					length: output.length,
					lines: output.split('\n').length,
				},
			};
		}

		const bestMatch = results[0];
		const metadata = this.extractMetadata(output, bestMatch);

		return {
			type: bestMatch.type,
			confidence: bestMatch.confidence,
			metadata: {
				...metadata,
				allMatches: results,
				classificationTime: new Date().toISOString(),
			},
		};
	}

	// Kiểm tra patterns
	checkPatterns(output, patterns) {
		const matches = [];

		for (const pattern of patterns) {
			if (typeof pattern === 'string') {
				// String pattern
				if (output.includes(pattern)) {
					matches.push({
						type: 'string',
						pattern,
						positions: this.findAllOccurrences(output, pattern),
					});
				}
			} else if (pattern instanceof RegExp) {
				// Regex pattern
				const regex = new RegExp(pattern.source, pattern.flags || 'g');
				let match;
				const positions = [];

				while ((match = regex.exec(output)) !== null) {
					positions.push({
						start: match.index,
						end: match.index + match[0].length,
						text: match[0],
					});
				}

				if (positions.length > 0) {
					matches.push({
						type: 'regex',
						pattern: pattern.source,
						positions,
					});
				}
			}
		}

		return matches;
	}

	// Tìm tất cả occurrences của string
	findAllOccurrences(text, search) {
		const positions = [];
		let index = text.indexOf(search);

		while (index !== -1) {
			positions.push({
				start: index,
				end: index + search.length,
				text: search,
			});
			index = text.indexOf(search, index + 1);
		}

		return positions;
	}

	// Tính confidence score
	calculateConfidence(output, matches) {
		const outputLength = output.length;
		const totalMatchLength = matches.reduce((sum, match) => {
			return (
				sum +
				match.positions.reduce(
					(posSum, pos) => posSum + (pos.end - pos.start),
					0,
				)
			);
		}, 0);

		// Confidence dựa trên tỷ lệ nội dung match
		let confidence = totalMatchLength / outputLength;

		// Boost confidence nếu có nhiều matches
		const matchCount = matches.length;
		if (matchCount > 1) {
			confidence = Math.min(1.0, confidence * (1 + (matchCount - 1) * 0.1));
		}

		return Math.max(0.1, Math.min(1.0, confidence));
	}

	// Trích xuất metadata cụ thể cho từng loại
	extractMetadata(output, classification) {
		const metadata = {
			length: output.length,
			lines: output.split('\n').length,
			characterCount: output.length,
		};

		switch (classification.type) {
			case 'git_diff':
				metadata.diffStats = this.extractGitDiffStats(output);
				break;

			case 'command_output':
				metadata.commandInfo = this.extractCommandInfo(output);
				break;

			case 'code':
				metadata.codeInfo = this.extractCodeInfo(output);
				break;

			case 'json':
				metadata.jsonInfo = this.extractJsonInfo(output);
				break;

			case 'error':
				metadata.errorInfo = this.extractErrorInfo(output);
				break;

			case 'url_list':
				metadata.urls = this.extractUrls(output);
				break;

			case 'file_path':
				metadata.paths = this.extractFilePaths(output);
				break;

			case 'list':
				metadata.listInfo = this.extractListInfo(output);
				break;

			case 'table':
				metadata.tableInfo = this.extractTableInfo(output);
				break;
		}

		return metadata;
	}

	// Extract metadata cho git diff
	extractGitDiffStats(output) {
		const lines = output.split('\n');
		const additions = lines.filter(
			line => line.startsWith('+') && !line.startsWith('+++'),
		).length;
		const deletions = lines.filter(
			line => line.startsWith('-') && !line.startsWith('---'),
		).length;
		const files = output.match(/^diff --git a\/(\S+) b\/(\S+)$/gm) || [];

		return {
			additions,
			deletions,
			filesChanged: files.length,
			files: files.map(f => f.match(/b\/(\S+)$/)[1]),
		};
	}

	// Extract metadata cho command output
	extractCommandInfo(output) {
		const lines = output.split('\n');
		const hasPrompt = lines.some(line => /^\$ |^\w+@\w+:/.test(line));
		const hasError = lines.some(line => /^Error:|error:|failed/i.test(line));

		return {
			hasPrompt,
			hasError,
			lineCount: lines.length,
		};
	}

	// Extract metadata cho code
	extractCodeInfo(output) {
		const language = this.detectCodeLanguage(output);
		const lines = output.split('\n');
		const hasComments = lines.some(
			line => /^\s*\/\//.test(line) || /^\s*\*/.test(line),
		);

		return {
			language,
			hasComments,
			lineCount: lines.length,
		};
	}

	// Extract metadata cho JSON
	extractJsonInfo(output) {
		try {
			const parsed = JSON.parse(output);
			return {
				isValid: true,
				type: Array.isArray(parsed) ? 'array' : typeof parsed,
				size: output.length,
				keys:
					typeof parsed === 'object' && parsed !== null
						? Object.keys(parsed)
						: [],
			};
		} catch {
			return {
				isValid: false,
				size: output.length,
			};
		}
	}

	// Extract metadata cho error messages
	extractErrorInfo(output) {
		const lines = output.split('\n');
		const errorLine = lines.find(line =>
			/^Error:|TypeError:|ReferenceError:/.test(line),
		);
		const hasStackTrace = lines.some(line =>
			/at\s+.*\s*\(\d+:\d+\)/.test(line),
		);

		return {
			errorType: errorLine?.split(':')[0] || 'unknown',
			hasStackTrace,
			lineCount: lines.length,
		};
	}

	// Extract URLs
	extractUrls(output) {
		const urlRegex = /https?:\/\/[^\s]+/g;
		return output.match(urlRegex) || [];
	}

	// Extract file paths
	extractFilePaths(output) {
		const pathPatterns = [
			/\/[\w\-\.\/]+/g,
			/[A-Za-z]:\\[\w\-\.\\]+/g,
			/\.\/[\w\-\.\/]+/g,
			/~\/[\w\-\.\/]+/g,
		];

		const paths = new Set();
		for (const pattern of pathPatterns) {
			const matches = output.match(pattern) || [];
			matches.forEach(match => paths.add(match));
		}

		return Array.from(paths);
	}

	// Extract list info
	extractListInfo(output) {
		const lines = output.split('\n');
		const listItems = lines.filter(line =>
			/^\s*[-*+•]\s+|^\s*\d+\.\s+/.test(line),
		);

		return {
			itemCount: listItems.length,
			type: /^\s*\d+\./.test(listItems[0] || '') ? 'numbered' : 'bulleted',
		};
	}

	// Extract table info
	extractTableInfo(output) {
		const lines = output.split('\n');
		const tableRows = lines.filter(line => line.includes('|'));
		const hasBorders = lines.some(line => /^\s*\+[-+]+\+\s*$/.test(line));

		return {
			rowCount: tableRows.length,
			hasBorders,
			columnCount: tableRows[0] ? tableRows[0].split('|').length - 1 : 0,
		};
	}

	// Detect code language
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

	// Format output theo loại
	formatOutput(output, classification) {
		switch (classification.type) {
			case 'git_diff':
				return this.formatGitDiff(output);
			case 'code':
				return this.formatCode(output, classification.metadata);
			case 'error':
				return this.formatError(output);
			case 'warning':
				return this.formatWarning(output);
			case 'success':
				return this.formatSuccess(output);
			case 'json':
				return this.formatJson(output);
			case 'command_output':
				return this.formatCommandOutput(output);
			default:
				return output;
		}
	}

	// Format git diff
	formatGitDiff(output) {
		const lines = output.split('\n');
		return lines
			.map(line => {
				if (line.startsWith('+') && !line.startsWith('+++')) {
					return `\x1b[32m${line}\x1b[0m`; // green for additions
				} else if (line.startsWith('-') && !line.startsWith('---')) {
					return `\x1b[31m${line}\x1b[0m`; // red for deletions
				} else if (
					line.startsWith('diff --git') ||
					line.startsWith('index') ||
					line.startsWith('+++') ||
					line.startsWith('---')
				) {
					return `\x1b[36m${line}\x1b[0m`; // cyan for headers
				}
				return line;
			})
			.join('\n');
	}

	// Format code
	formatCode(output, metadata) {
		// Simple syntax highlighting simulation
		const language = metadata.language || 'unknown';
		// In real implementation, this would use a proper syntax highlighter
		return output;
	}

	// Format error
	formatError(output) {
		return `\x1b[31m${output}\x1b[0m`; // red
	}

	// Format warning
	formatWarning(output) {
		return `\x1b[33m${output}\x1b[0m`; // yellow
	}

	// Format success
	formatSuccess(output) {
		return `\x1b[32m${output}\x1b[0m`; // green
	}

	// Format JSON
	formatJson(output) {
		try {
			return JSON.stringify(JSON.parse(output), null, 2);
		} catch {
			return output;
		}
	}

	// Format command output
	formatCommandOutput(output) {
		// Add some formatting for command output
		return output;
	}
}

export const outputClassifier = new OutputClassifier();
export default outputClassifier;
