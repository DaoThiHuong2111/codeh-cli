import {Box, Text} from 'ink';
import React from 'react';
import type {Command} from '../../../core/domain/valueObjects/Command.js';
import {CommandMenuItem} from '../molecules/CommandMenuItem.js';

interface SlashSuggestionsProps {
	commands: Command[];
	selectedIndex: number;
}

export const SlashSuggestions: React.FC<SlashSuggestionsProps> = ({
	commands,
	selectedIndex,
}) => {
	if (commands.length === 0) {
		return null;
	}

	return (
		<Box
			flexDirection="column"
		>
			<Text color="cyan" bold>
				Slash Commands (↑↓ to navigate):
			</Text>

			{commands.map((cmd, index) => (
				<CommandMenuItem
					key={cmd.cmd}
					command={cmd}
					isSelected={index === selectedIndex}
				/>
			))}
		</Box>
	);
};
