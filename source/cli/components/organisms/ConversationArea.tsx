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
	return (
		<Box flexDirection="column" >
			{messages.map(message => (
				<MessageBubble
					key={message.id}
					message={message}
					isStreaming={message.id === streamingMessageId}
				/>
			))}

			{isLoading && !streamingMessageId && (
				<Box marginTop={1}>
					<LoadingText text="Thinking..." />
				</Box>
			)}
		</Box>
	);
};
