/**
 * Base types for HomeScreen components
 */

/**
 * Message role in conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'error';

/**
 * Provider type
 */
export type Provider = 'anthropic' | 'openai' | 'ollama' | 'generic';

/**
 * History item type
 */
export type HistoryItemType = 'message' | 'system' | 'error';

/**
 * Single message in conversation
 */
export interface Message {
	role: MessageRole;
	content: string;
	timestamp?: Date;
}

/**
 * Usage statistics for API calls
 */
export interface UsageStats {
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
}

/**
 * History item representing a conversation turn
 */
export interface HistoryItem {
	id: number;
	type: HistoryItemType;
	userMessage?: string;
	assistantMessage?: string;
	systemMessage?: string;
	provider: Provider;
	timestamp: Date;
	usage?: UsageStats;
	finishReason?: 'stop' | 'length' | 'tool_calls' | 'error';
}

/**
 * Pending item during streaming
 */
export interface PendingItem extends Omit<HistoryItem, 'id'> {
	id?: number;
	isStreaming: boolean;
	streamingContent: string;
}
