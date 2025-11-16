import {Box, Text} from 'ink';
import React from 'react';
import type {Message} from '../../../core/domain/models/Message.js';
import {StreamingIndicator} from '../atoms/Spinner.js';
import {MarkdownText} from './MarkdownText.js';
import ToolCallDisplay from './ToolCallDisplay.js';

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

	// Format timestamp - handle both Date objects and ISO strings
	const timestamp = message.timestamp instanceof Date 
		? message.timestamp 
		: new Date(message.timestamp);
	const timeStr = timestamp.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
	});

	return (
		<Box flexDirection="column" marginY={0}>
			{/* Header: Role + Timestamp */}
			<Box>
				<Text color={config.color} bold wrap="wrap">
					{config.prefix}
				</Text>
				<Text color="gray" dimColor wrap="wrap">
					{' '}
					({timeStr})
				</Text>
			</Box>

			{/* Content */}
			<Box marginLeft={2} flexDirection="column">
				{/* Use markdown rendering for assistant messages */}
				{message.role === 'assistant' ? (
					<Box flexDirection="column">
						<MarkdownText content={message.content} />
						{isStreaming && <StreamingIndicator />}
					</Box>
				) : (
					<Box>
						<Text wrap="wrap">{message.content}</Text>
						{isStreaming && <StreamingIndicator />}
					</Box>
				)}
			</Box>

			{/* Tool Calls (if present) */}
			{message.toolCalls && message.toolCalls.length > 0 && (
				<Box marginLeft={2} marginTop={1}>
					<ToolCallDisplay
						toolCalls={message.toolCalls}
						status="completed"
					/>
				</Box>
			)}

			{/* Metadata (tokens) */}
			{message.metadata?.usage && (
				<Box marginLeft={2}>
					<Text color="gray" dimColor wrap="wrap">
						{message.metadata.usage.totalTokens} tokens
					</Text>
				</Box>
			)}
		</Box>
	);
};
