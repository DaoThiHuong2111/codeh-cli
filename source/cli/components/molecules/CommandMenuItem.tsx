import { Box, Text } from 'ink';
import React from 'react';
import type { Command } from '../../../core/domain/valueObjects/Command.js';

interface CommandMenuItemProps {
	command: Command;
	isSelected: boolean;
}

export const CommandMenuItem: React.FC<CommandMenuItemProps> = ({
	command,
	isSelected,
}) => {
	return (
		<Box>
			{isSelected && <Text color="cyan">› </Text>}
			{!isSelected && <Text>  </Text>}

			<Text color={isSelected ? 'cyan' : 'white'} bold={isSelected}>
				{command.cmd}
			</Text>

			<Text color="gray"> - {command.desc}</Text>
		</Box>
	);
};
