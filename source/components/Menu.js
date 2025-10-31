import React from 'react';
import {Box, Text} from 'ink';

export default function Menu({
	items,
	selectedIndex = 0,
	onSelect,
	itemRenderer,
	indicator = '▶',
	indicatorColor = 'green',
	selectedColor = 'yellow',
	normalColor = 'white',
}) {
	return (
		<Box flexDirection="column">
			{items.map((item, index) => (
				<Box key={index} marginBottom={1}>
					<Box marginRight={2}>
						<Text
							color={index === selectedIndex ? indicatorColor : normalColor}
						>
							{index === selectedIndex ? indicator : ' '}
						</Text>
					</Box>
					<Box>
						{itemRenderer ? (
							itemRenderer(item, index === selectedIndex)
						) : (
							<Text
								color={index === selectedIndex ? selectedColor : normalColor}
							>
								{typeof item === 'string'
									? item
									: item.label || item.toString()}
							</Text>
						)}
					</Box>
				</Box>
			))}
		</Box>
	);
}

// Simplified menu item renderer for basic use cases
export const renderMenuItem = (item, isSelected) => {
	const label = typeof item === 'string' ? item : item.label;
	const description = item.description;
	const color = isSelected ? 'yellow' : 'white';
	const descColor = isSelected ? 'cyan' : 'gray';

	return (
		<Box flexDirection="column">
			<Text color={color} bold={isSelected}>
				{label}
			</Text>
			{description && <Text color={descColor}>{description}</Text>}
		</Box>
	);
};
