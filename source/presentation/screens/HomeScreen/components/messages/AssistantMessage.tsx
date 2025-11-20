/**
 * AssistantMessage component
 * Displays AI assistant responses with provider branding
 */

import React from 'react';
import {Box, Text} from 'ink';
import {MarkdownDisplay} from '../MarkdownDisplay';
import {
	getProviderIcon,
	getProviderColor,
	THEME_COLORS,
} from '../../utils/colors';
import type {Provider, UsageStats} from '../../types';

export interface AssistantMessageProps {
	/** Message content in markdown */
	message: string;
	/** AI provider (anthropic, openai, ollama, generic) */
	provider: Provider;
	/** Whether message is still streaming */
	isPending?: boolean;
	/** Terminal width for text wrapping */
	terminalWidth: number;
	/** Available height for content */
	availableHeight?: number;
	/** Token usage statistics */
	usage?: UsageStats;
	/** Whether to render markdown (default: true) */
	renderMarkdown?: boolean;
}

/**
 * AssistantMessage - Display AI responses with provider-specific styling
 * Memoized to prevent unnecessary re-renders
 */
const AssistantMessageComponent: React.FC<AssistantMessageProps> = ({
	message,
	provider,
	isPending = false,
	terminalWidth,
	availableHeight,
	usage,
	renderMarkdown = true,
}) => {
	const icon = getProviderIcon(provider);
	const color = getProviderColor(provider);
	const providerName = getProviderName(provider);

	return (
		<Box flexDirection="column" marginY={1}>
			<Box marginBottom={1}>
				<Text color={color} bold>
					{icon} {providerName}
				</Text>
			</Box>

			<Box paddingLeft={2}>
				<MarkdownDisplay
					text={message}
					isPending={isPending}
					terminalWidth={terminalWidth - 2}
					availableHeight={availableHeight}
					renderMarkdown={renderMarkdown}
				/>
			</Box>

			{isPending && (
				<Box paddingLeft={2} marginTop={1}>
					<Text color={THEME_COLORS.ui.cursor} dimColor>
						● Streaming...
					</Text>
				</Box>
			)}

			{usage && !isPending && (
				<Box paddingLeft={2} marginTop={1}>
					<UsageDisplay usage={usage} />
				</Box>
			)}
		</Box>
	);
};

/**
 * Display usage statistics
 */
const UsageDisplay: React.FC<{usage: UsageStats}> = ({usage}) => {
	const parts: string[] = [];

	if (usage.promptTokens !== undefined) {
		parts.push(`${usage.promptTokens} in`);
	}

	if (usage.completionTokens !== undefined) {
		parts.push(`${usage.completionTokens} out`);
	}

	if (usage.totalTokens !== undefined) {
		parts.push(`${usage.totalTokens} total`);
	}

	if (parts.length === 0) return null;

	return (
		<Text color={THEME_COLORS.text.muted} dimColor>
			[{parts.join(' • ')}]
		</Text>
	);
};

/**
 * Get human-readable provider name
 */
function getProviderName(provider: Provider): string {
	const names: Record<Provider, string> = {
		anthropic: 'Claude',
		openai: 'OpenAI',
		ollama: 'Ollama',
		generic: 'Assistant',
	};

	return names[provider] || 'Assistant';
}

/**
 * Memoized AssistantMessage - prevents re-renders when props don't change
 */
export const AssistantMessage = React.memo(AssistantMessageComponent);
