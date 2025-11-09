import React from 'react';
import {Box, Text} from 'ink';

interface ProgressBarProps {
	current: number;
	total: number;
	width?: number;
	showPercentage?: boolean;
	color?: string;
	char?: string;
}

export default function ProgressBar({
	current,
	total,
	width = 40,
	showPercentage = true,
	color = 'green',
	char = '█',
}: ProgressBarProps) {
	const percentage = Math.min(100, Math.round((current / total) * 100));
	const filled = Math.round((width * percentage) / 100);
	const empty = width - filled;

	const filledBar = char.repeat(filled);
	const emptyBar = '░'.repeat(empty);

	return (
		<Box>
			<Box marginRight={1}>
				<Text color={color}>{filledBar}</Text>
				<Text dimColor>{emptyBar}</Text>
			</Box>
			{showPercentage && <Text color={color}>{percentage}%</Text>}
			{total && (
				<Box marginLeft={1}>
					<Text dimColor>
						({current}/{total})
					</Text>
				</Box>
			)}
		</Box>
	);
}
