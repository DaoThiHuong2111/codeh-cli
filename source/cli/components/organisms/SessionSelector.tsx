/**
 * SessionSelector Component
 * Interactive session browser with keyboard navigation
 */

import {Box, Text} from 'ink';
import React from 'react';
import type {SessionInfo} from '../../../core/domain/interfaces/ISessionManager.js';

export interface FormattedSession extends SessionInfo {
	relativeTime: string; // e.g., "2 hours ago"
}

interface SessionSelectorProps {
	sessions: FormattedSession[];
	selectedIndex: number;
}

export const SessionSelector: React.FC<SessionSelectorProps> = ({
	sessions,
	selectedIndex,
}) => {
	if (sessions.length === 0) {
		return (
			<Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1}>
				<Text color="yellow" bold>
					📁 Saved Sessions
				</Text>
				<Text color="gray" dimColor>
					No saved sessions found
				</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
			<Text color="cyan" bold>
				📁 Saved Sessions (↑↓ to navigate, Enter to load, ESC to cancel)
			</Text>

			{sessions.map((session, index) => {
				const isSelected = index === selectedIndex;

				return (
					<Box key={session.name} marginTop={index === 0 ? 1 : 0}>
						<Text
							color={isSelected ? 'green' : 'white'}
							bold={isSelected}
							dimColor={!isSelected}
						>
							{isSelected ? '> ' : '  '}
							{session.name}
							{' '}
							<Text color="gray">
								({session.relativeTime})
							</Text>
							{' - '}
							<Text color="blue">
								{session.messageCount} messages
							</Text>
						</Text>
					</Box>
				);
			})}
		</Box>
	);
};
