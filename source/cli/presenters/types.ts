/**
 * Presenter Types & View Models
 */

export interface ViewModel {
	loading: boolean;
	error?: string;
	data?: any;
}

export interface MessageViewModel {
	role: 'user' | 'assistant' | 'system' | 'error';
	content: string;
	timestamp: Date;
}

export interface ConversationViewModel {
	messages: MessageViewModel[];
	stats: {
		messageCount: number;
		estimatedTokens: number;
	};
}

export interface ExecutionResult {
	success: boolean;
	output: string;
	error?: string;
	metadata?: {
		duration?: number;
		tokenUsage?: {
			prompt: number;
			completion: number;
			total: number;
		};
	};
}

export interface ConfigViewModel {
	provider: string;
	model: string;
	baseUrl?: string;
	isValid: boolean;
	errors: string[];
}
