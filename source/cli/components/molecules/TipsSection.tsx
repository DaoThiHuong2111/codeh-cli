import React from 'react';
import { Box, Text } from 'ink';

interface Tip {
	text: string;
	highlight?: string;
}

interface TipsSectionProps {
	tips?: Tip[];
}

const defaultTips: Tip[] = [
	{ text: 'Ask questions, edit files, or run commands.' },
	{ text: 'Be specific for the best results.' },
	{ text: ' for more information.', highlight: '/help' },
];

export default function TipsSection({ tips = defaultTips }: TipsSectionProps) {
	return (
		<Box flexDirection="column" marginTop={1} paddingLeft={2}>
			<Text bold>Tips for getting started:</Text>
			{tips.map((tip, index) => (
				<Text key={index}>
					{index + 1}. {tip.highlight && <Text color="magenta">{tip.highlight}</Text>}
					{tip.text}
				</Text>
			))}
		</Box>
	);
}
