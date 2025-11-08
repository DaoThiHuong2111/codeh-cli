import { Text } from 'ink';
import React from 'react';

/**
 * Streaming indicator (cursor)
 */
export const StreamingIndicator: React.FC = () => (
	<Text color="green">▌</Text>
);

/**
 * Loading text
 */
export const LoadingText: React.FC<{ text?: string }> = ({
	text = 'Loading...',
}) => (
	<Text color="cyan">
		<Text dimColor>◌</Text> {text}
	</Text>
);
