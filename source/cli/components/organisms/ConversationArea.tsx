import {Box, Text} from 'ink';
import React from 'react';
import type {Message} from '../../../core/domain/models/Message.js';
import {MessageBubble} from '../molecules/MessageBubble.js';
import {LoadingText} from '../atoms/Spinner.js';

interface ConversationAreaProps {
	messages: Message[];
	isLoading: boolean;
	streamingMessageId?: string | null;
}

export const ConversationArea: React.FC<ConversationAreaProps> = ({
	messages,
	isLoading,
	streamingMessageId,
}) => {
	// Empty state
	if (messages.length === 0 && !isLoading) {
		return (
			<Box marginY={1}>
				<Text color="gray" dimColor>
					No conversation yet. Type a message to start!
				</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" marginY={1}>
			{/* Render all messages */}
			{messages.map(message => (
				<MessageBubble
					key={message.id}
					message={message}
					isStreaming={message.id === streamingMessageId}
				/>
			))}

			{/* Loading indicator (when not streaming) */}
			{isLoading && !streamingMessageId && (
				<Box marginTop={1}>
					<LoadingText text="Thinking..." />
				</Box>
			)}
		</Box>
	);
};
