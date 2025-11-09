import React from 'react';
import {Box, Text} from 'ink';

interface ButtonProps {
	label: string;
	onPress?: () => void;
	color?: string;
	bgColor?: string;
	paddingX?: number;
	paddingY?: number;
	border?: boolean;
	focused?: boolean;
}

export default function Button({
	label,
	onPress,
	color = 'blue',
	bgColor = 'bgBlue',
	paddingX = 2,
	paddingY = 1,
	border = true,
	focused = false,
}: ButtonProps) {
	const borderChar = '─';
	const sideBorder = '│';
	const corners = {
		topLeft: '┌',
		topRight: '┐',
		bottomLeft: '└',
		bottomRight: '┘',
	};

	const content = ` ${label} `;
	const contentWidth = content.length + paddingX * 2;
	const borderLine = borderChar.repeat(contentWidth);

	const textColor = focused ? 'black' : color;
	const backgroundColor = focused ? bgColor : undefined;

	return (
		<Box flexDirection="column">
			{border && (
				<Box>
					<Text color={color}>
						{corners.topLeft}
						{borderLine}
						{corners.topRight}
					</Text>
				</Box>
			)}
			<Box>
				{border && <Text color={color}>{sideBorder}</Text>}
				<Box paddingLeft={paddingX} paddingRight={paddingX} paddingY={paddingY}>
					<Text
						color={textColor}
						backgroundColor={backgroundColor}
						bold={focused}
					>
						{label}
					</Text>
				</Box>
				{border && <Text color={color}>{sideBorder}</Text>}
			</Box>
			{border && (
				<Box>
					<Text color={color}>
						{corners.bottomLeft}
						{borderLine}
						{corners.bottomRight}
					</Text>
				</Box>
			)}
		</Box>
	);
}
