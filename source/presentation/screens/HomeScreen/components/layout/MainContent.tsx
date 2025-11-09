/**
 * MainContent component
 * Displays chat history with streaming support
 */

import React from 'react';
import {Box, Static} from 'ink';
import {HistoryItemDisplay} from '../messages/HistoryItemDisplay';
import type {HistoryItem, PendingItem} from '../../types';

export interface MainContentProps {
	/** Chat history items */
	history: HistoryItem[];
	/** Currently pending/streaming item */
	pendingItem: PendingItem | null;
	/** Terminal width */
	terminalWidth: number;
	/** Terminal height */
	terminalHeight: number;
	/** Reserved height for input and footer */
	reservedHeight?: number;
}

/**
 * MainContent - Display chat history and streaming messages
 */
export const MainContent: React.FC<MainContentProps> = ({
	history,
	pendingItem,
	terminalWidth,
	terminalHeight,
	reservedHeight = 5,
}) => {
	// Calculate available height for content
	const availableHeight = Math.max(terminalHeight - reservedHeight, 10);

	return (
		<Box flexDirection="column" height={availableHeight}>
			{/* Static history items - won't re-render */}
			{history.length > 0 && (
				<Static items={history}>
					{item => (
						<HistoryItemDisplay
							key={item.id}
							item={item}
							terminalWidth={terminalWidth}
							availableHeight={availableHeight}
						/>
					)}
				</Static>
			)}

			{/* Pending/streaming item - updates dynamically */}
			{pendingItem && (
				<HistoryItemDisplay
					item={pendingItem}
					terminalWidth={terminalWidth}
					availableHeight={availableHeight}
				/>
			)}

			{/* Empty state */}
			{history.length === 0 && !pendingItem && (
				<Box
					flexDirection="column"
					justifyContent="center"
					alignItems="center"
					height={availableHeight}
				>
					<Box marginBottom={1}>
						<Box>✦ Welcome to AI Chat</Box>
					</Box>
					<Box>Type a message to start...</Box>
				</Box>
			)}
		</Box>
	);
};
