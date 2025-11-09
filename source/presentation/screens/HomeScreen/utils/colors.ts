/**
 * Color utilities and theme constants
 */

import type {Provider} from '../types';

/**
 * Theme color palette
 */
export const THEME_COLORS = {
	// Text colors
	text: {
		primary: '#FFFFFF',
		secondary: '#E0E0E0',
		accent: '#00FFFF',
		muted: '#808080',
		error: '#FF5555',
		warning: '#FFAA00',
		success: '#00FF00',
	},

	// Provider colors
	provider: {
		anthropic: '#00FFFF', // Cyan for Claude
		openai: '#74AA9C', // Teal for OpenAI
		ollama: '#FF6B6B', // Red for Ollama
		generic: '#888888', // Gray for generic
	},

	// Syntax highlighting colors
	syntax: {
		keyword: '#C792EA', // Purple
		string: '#C3E88D', // Green
		number: '#F78C6C', // Orange
		comment: '#546E7A', // Gray
		function: '#82AAFF', // Blue
		variable: '#FFCB6B', // Yellow
		operator: '#89DDFF', // Cyan
		class: '#FFCB6B', // Yellow
		constant: '#F78C6C', // Orange
		type: '#FFCB6B', // Yellow
		parameter: '#EEFFFF', // White
		property: '#EEFFFF', // White
		tag: '#F07178', // Red
		attribute: '#C792EA', // Purple
	},

	// UI element colors
	ui: {
		border: '#404040',
		background: '#1E1E1E',
		selection: '#264F78',
		cursor: '#FFFFFF',
		lineNumber: '#858585',
	},
} as const;

/**
 * Provider icon map
 */
export const PROVIDER_ICONS: Record<Provider, string> = {
	anthropic: '✦',
	openai: '◆',
	ollama: '◉',
	generic: '●',
};

/**
 * Get color for provider
 */
export function getProviderColor(provider: Provider): string {
	return THEME_COLORS.provider[provider] || THEME_COLORS.provider.generic;
}

/**
 * Get icon for provider
 */
export function getProviderIcon(provider: Provider): string {
	return PROVIDER_ICONS[provider] || PROVIDER_ICONS.generic;
}

/**
 * Get syntax highlighting color for token type
 */
export function getSyntaxColor(tokenType: string): string {
	const normalized = tokenType.toLowerCase();

	// Map common token types
	if (normalized.includes('keyword')) return THEME_COLORS.syntax.keyword;
	if (normalized.includes('string')) return THEME_COLORS.syntax.string;
	if (normalized.includes('number')) return THEME_COLORS.syntax.number;
	if (normalized.includes('comment')) return THEME_COLORS.syntax.comment;
	if (normalized.includes('function')) return THEME_COLORS.syntax.function;
	if (normalized.includes('variable')) return THEME_COLORS.syntax.variable;
	if (normalized.includes('operator')) return THEME_COLORS.syntax.operator;
	if (normalized.includes('class')) return THEME_COLORS.syntax.class;
	if (normalized.includes('constant')) return THEME_COLORS.syntax.constant;
	if (normalized.includes('type')) return THEME_COLORS.syntax.type;
	if (normalized.includes('parameter')) return THEME_COLORS.syntax.parameter;
	if (normalized.includes('property')) return THEME_COLORS.syntax.property;
	if (normalized.includes('tag')) return THEME_COLORS.syntax.tag;
	if (normalized.includes('attribute')) return THEME_COLORS.syntax.attribute;

	// Default color
	return THEME_COLORS.text.primary;
}

/**
 * Animation frames for streaming cursor
 */
export const STREAMING_CURSOR_FRAMES = ['▊', '▉', '█', '▉'];

/**
 * Get streaming cursor frame
 */
export function getStreamingCursorFrame(frameIndex: number): string {
	return STREAMING_CURSOR_FRAMES[frameIndex % STREAMING_CURSOR_FRAMES.length];
}
