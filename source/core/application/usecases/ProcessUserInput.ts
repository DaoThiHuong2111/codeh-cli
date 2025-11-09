/**
 * Process User Input Use Case
 * Validates and classifies user input before processing
 */

import {InputClassifier} from '../services/InputClassifier';

export interface InputValidationResult {
	valid: boolean;
	errors: string[];
	inputType?: 'chat' | 'command' | 'tool';
	sanitizedInput?: string;
}

export interface ProcessUserInputRequest {
	input: string;
	options?: {
		allowCommands?: boolean;
		allowTools?: boolean;
		maxLength?: number;
	};
}

export interface ProcessUserInputResponse {
	validation: InputValidationResult;
	processedInput: string;
	metadata: {
		originalLength: number;
		processedLength: number;
		sanitized: boolean;
	};
}

export class ProcessUserInput {
	private inputClassifier: InputClassifier;

	constructor() {
		this.inputClassifier = new InputClassifier();
	}

	async execute(
		request: ProcessUserInputRequest,
	): Promise<ProcessUserInputResponse> {
		const {input, options = {}} = request;
		const {
			allowCommands = true,
			allowTools = true,
			maxLength = 10000,
		} = options;

		// Validate input
		const validation = this.inputClassifier.validate(input);

		// Additional validations
		const errors: string[] = [...validation.errors];

		// Check length
		if (input.length > maxLength) {
			errors.push(`Input exceeds maximum length of ${maxLength} characters`);
		}

		// Check if command/tool allowed
		const inputType = this.classifyInput(input);
		if (inputType === 'command' && !allowCommands) {
			errors.push('Commands are not allowed in this context');
		}
		if (inputType === 'tool' && !allowTools) {
			errors.push('Tool calls are not allowed in this context');
		}

		// Sanitize input
		const sanitizedInput = this.sanitizeInput(input);
		const wasSanitized = sanitizedInput !== input;

		// Build response
		const validationResult: InputValidationResult = {
			valid: errors.length === 0,
			errors,
			inputType,
			sanitizedInput,
		};

		return {
			validation: validationResult,
			processedInput: sanitizedInput,
			metadata: {
				originalLength: input.length,
				processedLength: sanitizedInput.length,
				sanitized: wasSanitized,
			},
		};
	}

	private classifyInput(input: string): 'chat' | 'command' | 'tool' {
		const trimmed = input.trim();

		// Command detection (starts with /)
		if (trimmed.startsWith('/')) {
			return 'command';
		}

		// Tool call detection (specific patterns)
		if (
			trimmed.includes('<tool>') ||
			trimmed.includes('execute:') ||
			trimmed.includes('use_tool')
		) {
			return 'tool';
		}

		// Default: chat
		return 'chat';
	}

	private sanitizeInput(input: string): string {
		// Remove null bytes
		let sanitized = input.replace(/\0/g, '');

		// Trim excessive whitespace
		sanitized = sanitized.replace(/\s+/g, ' ');

		// Remove control characters (except newlines and tabs)
		sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

		return sanitized;
	}
}
