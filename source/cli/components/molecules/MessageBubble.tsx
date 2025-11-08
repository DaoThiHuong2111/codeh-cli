import { Box, Text } from 'ink';
import React from 'react';
import type { Message } from '../../../core/domain/models/Message.js';
import { StreamingIndicator } from '../atoms/Spinner.js';

interface MessageBubbleProps {
	message: Message;
	isStreaming?: boolean;
}

const ROLE_CONFIG = {
	user: {
		prefix: '> You',
		color: 'cyan',
	},
	assistant: {
		prefix: '< Assistant',
		color: 'green',
	},
	error: {
		prefix: '✗ Error',
		color: 'red',
	},
	system: {
		prefix: 'ℹ System',
		color: 'blue',
	},
} as const;

export const MessageBubble: React.FC<MessageBubbleProps> = ({
	message,
	isStreaming = false,
}) => {
	const config = ROLE_CONFIG[message.role];

	// Format timestamp
	const timeStr = message.timestamp.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
	});

	return (
		<Box flexDirection="column" marginY={0}>
			{/* Header: Role + Timestamp */}
			<Box>
				<Text color={config.color} bold>
					{config.prefix}
				</Text>
				<Text color="gray" dimColor>
					{' '}
					({timeStr})
				</Text>
			</Box>

			{/* Content */}
			<Box marginLeft={2}>
				<Text>{message.content}</Text>
				{isStreaming && <StreamingIndicator />}
			</Box>

			{/* Metadata (tokens) */}
			{message.metadata?.usage && (
				<Box marginLeft={2}>
					<Text color="gray" dimColor>
						🪙 {message.metadata.usage.totalTokens} tokens
					</Text>
				</Box>
			)}
		</Box>
	);
};
