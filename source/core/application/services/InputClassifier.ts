/**
 * Input Classifier Service
 * Classifies and validates user input
 */

import {
	InputType,
	InputClassification,
} from '../../domain/valueObjects/InputType';

export interface ValidationResult {
	valid: boolean;
	warnings: string[];
	errors: string[];
	classification: InputClassification;
}

export class InputClassifier {
	private maxInputLength: number = 10000;
	private blockedKeywords: string[] = [];
	private allowedCommands: string[] = [
		'git',
		'npm',
		'yarn',
		'node',
		'python',
		'pip',
		'ls',
		'cd',
		'pwd',
		'mkdir',
		'touch',
		'cat',
		'echo',
		'rm',
		'cp',
		'mv',
		'grep',
		'find',
		'chmod',
		'curl',
		'wget',
		'docker',
		'kubectl',
	];

	/**
	 * Classify input type
	 */
	classify(input: string): InputClassification {
		if (this.isCommand(input)) {
			return new InputClassification(InputType.COMMAND, 0.9, {
				baseCommand: this.extractBaseCommand(input),
			});
		}

		if (this.isUrl(input)) {
			return new InputClassification(InputType.URL, 0.95, {
				url: input.trim(),
			});
		}

		if (this.isCode(input)) {
			return new InputClassification(InputType.CODE, 0.8, {
				language: this.detectCodeLanguage(input),
			});
		}

		if (this.isFilePath(input)) {
			return new InputClassification(InputType.FILE, 0.85, {
				path: input.trim(),
			});
		}

		return new InputClassification(InputType.TEXT, 1.0);
	}

	/**
	 * Validate input
	 */
	validate(input: string): ValidationResult {
		const classification = this.classify(input);
		const warnings: string[] = [];
		const errors: string[] = [];

		if (input.length > this.maxInputLength) {
			errors.push(`Input too long (max ${this.maxInputLength} characters)`);
		}

		const blocked = this.findBlockedKeywords(input);
		if (blocked.length > 0) {
			errors.push(`Input contains blocked keywords: ${blocked.join(', ')}`);
		}

		if (classification.isCommand()) {
			const baseCommand = this.extractBaseCommand(input);
			if (!this.allowedCommands.includes(baseCommand)) {
				errors.push(`Command not allowed: ${baseCommand}`);
			}
		}

		return {
			valid: errors.length === 0,
			warnings,
			errors,
			classification,
		};
	}

	/**
	 * Check if input is a command
	 */
	private isCommand(input: string): boolean {
		const trimmed = input.trim();
		const baseCommand = this.extractBaseCommand(trimmed);
		return this.allowedCommands.includes(baseCommand);
	}

	/**
	 * Check if input is code
	 */
	private isCode(input: string): boolean {
		const codePatterns = [
			/^\s*function\s+\w+\s*\(/,
			/^\s*const\s+\w+\s*=/,
			/^\s*let\s+\w+\s*=/,
			/^\s*var\s+\w+\s*=/,
			/^\s*class\s+\w+/,
			/^\s*import\s+/,
			/^\s*export\s+/,
			/^\s*def\s+\w+\s*\(/,
			/^\s*if\s*\(/,
			/^\s*for\s*\(/,
			/^\s*while\s*\(/,
			/\{\s*\n.*\n\}/s,
			/\(.*\)\s*=>/,
			/```[\s\S]*```/,
		];

		return codePatterns.some(pattern => pattern.test(input));
	}

	/**
	 * Check if input is a URL
	 */
	private isUrl(input: string): boolean {
		const urlPattern = /^https?:\/\/.+/;
		return urlPattern.test(input.trim());
	}

	/**
	 * Check if input is a file path
	 */
	private isFilePath(input: string): boolean {
		const filePathPatterns = [
			/^\.\/.+/,
			/^~\//,
			/^\/.+/,
			/^[a-zA-Z]:\\/,
			/^[a-zA-Z]:\//,
		];

		return filePathPatterns.some(pattern => pattern.test(input.trim()));
	}

	/**
	 * Extract base command from input
	 */
	private extractBaseCommand(input: string): string {
		const trimmed = input.trim();
		const firstWord = trimmed.split(/\s+/)[0];
		return firstWord;
	}

	/**
	 * Detect code language
	 */
	private detectCodeLanguage(code: string): string {
		if (/^\s*(function|const|let|var|class|import|export)/.test(code)) {
			return 'javascript';
		}
		if (/^\s*def\s+\w+/.test(code)) {
			return 'python';
		}
		if (/^\s*(public|private|class)\s+/.test(code)) {
			return 'java';
		}
		return 'unknown';
	}

	/**
	 * Find blocked keywords in input
	 */
	private findBlockedKeywords(input: string): string[] {
		const lowerInput = input.toLowerCase();
		return this.blockedKeywords.filter(keyword => lowerInput.includes(keyword));
	}

	/**
	 * Add blocked keyword
	 */
	addBlockedKeyword(keyword: string): void {
		if (!this.blockedKeywords.includes(keyword.toLowerCase())) {
			this.blockedKeywords.push(keyword.toLowerCase());
		}
	}

	/**
	 * Add allowed command
	 */
	addAllowedCommand(command: string): void {
		if (!this.allowedCommands.includes(command)) {
			this.allowedCommands.push(command);
		}
	}

	/**
	 * Remove allowed command
	 */
	removeAllowedCommand(command: string): void {
		const index = this.allowedCommands.indexOf(command);
		if (index > -1) {
			this.allowedCommands.splice(index, 1);
		}
	}

	getAllowedCommands(): string[] {
		return [...this.allowedCommands];
	}
}
