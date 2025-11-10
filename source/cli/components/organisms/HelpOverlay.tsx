/**
 * Help Overlay Component
 * Shows keyboard shortcuts and available commands
 */

import {Box, Text} from 'ink';
import React from 'react';

export interface HelpOverlayProps {
	onClose: () => void;
}

export const HelpOverlay: React.FC<HelpOverlayProps> = ({onClose}) => {
	return (
		<Box
			flexDirection="column"		>
			{/* Header */}
			<Box marginBottom={1}>
				<Text color="cyan" bold>
					Help & Keyboard Shortcuts
				</Text>
			</Box>

			{/* Keyboard Shortcuts */}
			<Box flexDirection="column" marginBottom={1}>
				<Text color="yellow" bold>
					Keyboard Shortcuts:
				</Text>
				<Box marginLeft={2} flexDirection="column">
					<Text>
						<Text color="green">?</Text> - Toggle this help overlay
					</Text>
					<Text>
						<Text color="green">Esc</Text> - Close overlay / Clear input
					</Text>
					<Text>
						<Text color="green">↑/↓</Text> - Navigate input history
					</Text>
					<Text>
						<Text color="green">Tab/Enter</Text> - Select suggestion
					</Text>
				</Box>
			</Box>

			{/* Slash Commands */}
			<Box flexDirection="column" marginBottom={1}>
				<Text color="yellow" bold>
					Slash Commands:
				</Text>
				<Box marginLeft={2} flexDirection="column">
					<Text>
						<Text color="green">/help</Text> - Show help documentation
					</Text>
					<Text>
						<Text color="green">/clear</Text> - Clear conversation history
					</Text>
					<Text>
						<Text color="green">/new</Text> - Start new conversation
					</Text>
					<Text>
						<Text color="green">/save [name]</Text> - Save current session
					</Text>
					<Text>
						<Text color="green">/load [name]</Text> - Load saved session
					</Text>
					<Text>
						<Text color="green">/sessions</Text> - List all sessions
					</Text>
				</Box>
			</Box>

		</Box>
	);
};
