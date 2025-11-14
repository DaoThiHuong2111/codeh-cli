/**
 * Output Formatter Service
 * Classifies and formats output content
 */

export enum OutputType {
	GIT_DIFF = 'git_diff',
	COMMAND_OUTPUT = 'command_output',
	CODE = 'code',
	JSON = 'json',
	ERROR = 'error',
	WARNING = 'warning',
	SUCCESS = 'success',
	URL_LIST = 'url_list',
	FILE_PATH = 'file_path',
	LIST = 'list',
	TABLE = 'table',
	TEXT = 'text',
}

export interface OutputClassification {
	type: OutputType;
	confidence: number;
	metadata?: Record<string, any>;
}

export class OutputFormatter {
	/**
	 * Classify output type
	 */
	classify(output: string): OutputClassification {
		if (this.isGitDiff(output)) {
			return {type: OutputType.GIT_DIFF, confidence: 0.95};
		}

		if (this.isError(output)) {
			return {type: OutputType.ERROR, confidence: 0.9};
		}

		if (this.isWarning(output)) {
			return {type: OutputType.WARNING, confidence: 0.85};
		}

		if (this.isSuccess(output)) {
			return {type: OutputType.SUCCESS, confidence: 0.85};
		}

		if (this.isJson(output)) {
			return {type: OutputType.JSON, confidence: 0.9};
		}

		if (this.isCode(output)) {
			return {
				type: OutputType.CODE,
				confidence: 0.8,
				metadata: {language: this.detectLanguage(output)},
			};
		}

		if (this.isUrlList(output)) {
			return {type: OutputType.URL_LIST, confidence: 0.85};
		}

		if (this.isTable(output)) {
			return {type: OutputType.TABLE, confidence: 0.8};
		}

		if (this.isList(output)) {
			return {type: OutputType.LIST, confidence: 0.75};
		}

		return {type: OutputType.TEXT, confidence: 1.0};
	}

	/**
	 * Format output based on type
	 */
	format(output: string, type?: OutputType): string {
		const classification = type
			? {type, confidence: 1.0}
			: this.classify(output);

		switch (classification.type) {
			case OutputType.JSON:
				return this.formatJson(output);
			case OutputType.CODE:
				return this.formatCode(output);
			case OutputType.ERROR:
				return this.formatError(output);
			case OutputType.WARNING:
				return this.formatWarning(output);
			case OutputType.SUCCESS:
				return this.formatSuccess(output);
			default:
				return output;
		}
	}

	private isGitDiff(output: string): boolean {
		const patterns = [
			/^diff --git/m,
			/^index [a-f0-9]+/m,
			/^\+\+\+ b\//m,
			/^--- a\//m,
		];
		return patterns.some(p => p.test(output));
	}

	private isError(output: string): boolean {
		const patterns = [
			/^Error:/im,
			/^TypeError:/im,
			/^ReferenceError:/im,
			/^SyntaxError:/im,
			/^NetworkError:/im,
			/^Failed to/im,
			/Exception:/im,
		];
		return patterns.some(p => p.test(output));
	}

	private isWarning(output: string): boolean {
		const patterns = [/^Warning:/im, /^Caution:/im, /^Deprecated:/im];
		return patterns.some(p => p.test(output));
	}

	private isSuccess(output: string): boolean {
		const patterns = [
			/^Success:/im,
			/^Completed:/im,
			/^Done:/im,
			/^Finished:/im,
			/^OK/im,
		];
		return patterns.some(p => p.test(output));
	}

	private isJson(output: string): boolean {
		const trimmed = output.trim();
		if (
			(trimmed.startsWith('{') && trimmed.endsWith('}')) ||
			(trimmed.startsWith('[') && trimmed.endsWith(']'))
		) {
			try {
				JSON.parse(trimmed);
				return true;
			} catch {
				return false;
			}
		}
		return false;
	}

	private isCode(output: string): boolean {
		const patterns = [
			/```[\s\S]*```/,
			/^\s*function\s+\w+/m,
			/^\s*class\s+\w+/m,
			/^\s*const\s+\w+\s*=/m,
			/^\s*import\s+/m,
			/\{\s*\n.*\n\}/s,
		];
		return patterns.some(p => p.test(output));
	}

	private isUrlList(output: string): boolean {
		const urlPattern = /https?:\/\/[^\s]+/g;
		const matches = output.match(urlPattern);
		return matches !== null && matches.length >= 2;
	}

	private isTable(output: string): boolean {
		const lines = output.split('\n');
		const hasSeparators = lines.some(line => /^[|\-+]+$/.test(line.trim()));
		const hasCells = lines.some(line => line.includes('|'));
		return hasSeparators && hasCells;
	}

	private isList(output: string): boolean {
		const lines = output.split('\n');
		const listLines = lines.filter(line =>
			/^\s*[-*•]\s+|^\s*\d+\.\s+/.test(line),
		);
		return listLines.length >= 3;
	}

	private detectLanguage(code: string): string {
		if (/^\s*(function|const|let|var|class|import|export)/m.test(code)) {
			return 'javascript';
		}
		if (/^\s*def\s+\w+/m.test(code)) {
			return 'python';
		}
		if (/^\s*(public|private|class)\s+/m.test(code)) {
			return 'java';
		}
		return 'unknown';
	}

	private formatJson(output: string): string {
		try {
			const parsed = JSON.parse(output);
			return JSON.stringify(parsed, null, 2);
		} catch {
			return output;
		}
	}

	private formatCode(output: string): string {
		// Basic code formatting - can be enhanced
		return output;
	}

	private formatError(output: string): string {
		return ` ${output}`;
	}

	private formatWarning(output: string): string {
		return `⚠️  ${output}`;
	}

	private formatSuccess(output: string): string {
		return `✅ ${output}`;
	}
}
