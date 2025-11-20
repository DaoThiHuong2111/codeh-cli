/**
 * HistoryItemDisplay component
 * Wrapper that renders appropriate message components based on history item type
 */

import React from 'react';
import {Box} from 'ink';
import {AssistantMessage} from './AssistantMessage';
import {UserMessage} from './UserMessage';
import {SystemMessage} from './SystemMessage';
import type {HistoryItem, PendingItem} from '../../types';

export interface HistoryItemDisplayProps {
	/** History item or pending item to display */
	item: HistoryItem | PendingItem;
	/** Terminal width for text wrapping */
	terminalWidth: number;
	/** Available height for content */
	availableHeight?: number;
}

/**
 * HistoryItemDisplay - Renders appropriate message components based on item type
 */
export const HistoryItemDisplay: React.FC<HistoryItemDisplayProps> = ({
	item,
	terminalWidth,
	availableHeight,
}) => {
	const isPending = isPendingItem(item);

	return (
		<Box flexDirection="column">
			{item.userMessage && (
				<UserMessage
					message={item.userMessage}
					terminalWidth={terminalWidth}
					timestamp={item.timestamp}
				/>
			)}

			{isPending ? (
				item.streamingContent && (
					<AssistantMessage
						message={item.streamingContent}
						provider={item.provider}
						isPending={true}
						terminalWidth={terminalWidth}
						availableHeight={availableHeight}
					/>
				)
			) : (
				item.assistantMessage && (
					<AssistantMessage
						message={item.assistantMessage}
						provider={item.provider}
						isPending={false}
						terminalWidth={terminalWidth}
						availableHeight={availableHeight}
						usage={item.usage}
					/>
				)
			)}

			{item.systemMessage && (
				<SystemMessage
					message={item.systemMessage}
					type={item.type === 'error' ? 'error' : 'info'}
					terminalWidth={terminalWidth}
				/>
			)}
		</Box>
	);
};

/**
 * Type guard to check if item is PendingItem
 */
function isPendingItem(item: HistoryItem | PendingItem): item is PendingItem {
	return 'isStreaming' in item && (item as PendingItem).isStreaming;
}
