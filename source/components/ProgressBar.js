import React from 'react';
import {Box, Text} from 'ink';

export default function ProgressBar({
	value = 0,
	max = 100,
	width = 40,
	character = '█',
	backgroundChar = '░',
	color = 'green',
	backgroundColor = 'gray',
	showPercentage = true,
	label,
}) {
	const percentage = Math.max(0, Math.min(100, (value / max) * 100));
	const filledChars = Math.round((percentage / 100) * width);
	const emptyChars = width - filledChars;

	const filledBar = character.repeat(filledChars);
	const emptyBar = backgroundChar.repeat(emptyChars);

	return (
		<Box flexDirection="column">
			{label && (
				<Box marginBottom={1}>
					<Text color="white">{label}</Text>
				</Box>
			)}
			<Box>
				<Text color={color}>{filledBar}</Text>
				<Text color={backgroundColor}>{emptyBar}</Text>
				{showPercentage && (
					<Box marginLeft={2}>
						<Text color="white">{Math.round(percentage)}%</Text>
					</Box>
				)}
			</Box>
		</Box>
	);
}

// Preset progress bar styles
export const SimpleProgressBar = props => (
	<ProgressBar character="█" backgroundChar="░" {...props} />
);

export const DottedProgressBar = props => (
	<ProgressBar character="●" backgroundChar="○" {...props} />
);
