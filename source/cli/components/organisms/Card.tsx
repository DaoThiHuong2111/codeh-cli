import React from 'react';
import {Box, Text} from 'ink';

interface CardProps {
	title?: string;
	children: React.ReactNode;
	borderColor?: string;
	titleColor?: string;
	padding?: number;
	margin?: number;
	width?: number;
}

export default function Card({
	title,
	children,
	borderColor = 'blue',
	titleColor = 'cyan',
	padding = 1,
	margin = 0,
	width = 60,
}: CardProps) {
	const borderChar = '─';
	const sideBorder = '│';
	const corners = {
		topLeft: '┌',
		topRight: '┐',
		bottomLeft: '└',
		bottomRight: '┘',
	};

	const borderLine = borderChar.repeat(width);

	const renderTitle = () => {
		if (!title) return null;

		const titlePadding = Math.max(0, width - title.length - 4);
		const titleText = ` ${title} ${' '.repeat(titlePadding)}`;

		return (
			<Box>
				<Text color={borderColor}>{corners.topLeft}</Text>
				<Text color={titleColor} backgroundColor={borderColor}>
					{titleText}
				</Text>
				<Text color={borderColor}>{corners.topRight}</Text>
			</Box>
		);
	};

	const renderTopBorder = () => {
		if (title) return null;
		return (
			<Box>
				<Text color={borderColor}>
					{corners.topLeft}
					{borderLine}
					{corners.topRight}
				</Text>
			</Box>
		);
	};

	return (
		<Box flexDirection="column" marginTop={margin} marginBottom={margin}>
			{renderTitle()}
			{renderTopBorder()}

			{/* Content */}
			{React.Children.map(children, (child, index) => (
				<Box key={index}>
					<Text color={borderColor}>{sideBorder}</Text>
					<Box paddingLeft={padding} paddingRight={padding}>
						{child}
					</Box>
					<Text color={borderColor}>{sideBorder}</Text>
				</Box>
			))}

			{/* Bottom border */}
			<Box>
				<Text color={borderColor}>
					{corners.bottomLeft}
					{borderLine}
					{corners.bottomRight}
				</Text>
			</Box>
		</Box>
	);
}
