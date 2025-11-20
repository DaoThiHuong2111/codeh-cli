/**
 * UserMessage component
 * Displays user input messages
 */

import React from 'react';
import {Box, Text} from 'ink';
import {RenderInline} from '../markdown/InlineMarkdownRenderer';
import {THEME_COLORS} from '../../utils/colors';
import {wrapText} from '../../utils/textUtils';

export interface UserMessageProps {
	/** User message text */
	message: string;
	/** Terminal width for text wrapping */
	terminalWidth: number;
	/** Optional timestamp */
	timestamp?: Date;
	/** Whether to render inline markdown (default: true) */
	renderInline?: boolean;
}

/**
 * UserMessage - Display user input with distinct styling
 */
export const UserMessage: React.FC<UserMessageProps> = ({
	message,
	terminalWidth,
	timestamp,
	renderInline = true,
}) => {
	const userIcon = '›';
	const userColor = THEME_COLORS.text.accent;

	const contentWidth = terminalWidth - 4;
	const lines = wrapText(message, contentWidth);

	return (
		<Box flexDirection="column" marginY={1}>
			<Box>
				<Text color={userColor} bold>
					{userIcon} You
				</Text>
				{timestamp && (
					<Text color={THEME_COLORS.text.muted} dimColor>
						{' '}
						• {formatTimestamp(timestamp)}
					</Text>
				)}
			</Box>

			<Box paddingLeft={2} marginTop={1}>
				<Box flexDirection="column">
					{lines.map((line, index) => (
						<Text key={index} color={THEME_COLORS.text.primary}>
							{renderInline ? <RenderInline text={line} /> : line}
						</Text>
					))}
				</Box>
			</Box>
		</Box>
	);
};

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	return `${hours}:${minutes}`;
}
