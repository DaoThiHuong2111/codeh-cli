import React from 'react';
import {Box, Text} from 'ink';

export interface MenuItem {
	label: string;
	value: string;
	description?: string;
}

interface MenuProps {
	items: MenuItem[];
	selectedIndex: number;
	onSelect?: (item: MenuItem, index: number) => void;
}

export default function Menu({items, selectedIndex, onSelect}: MenuProps) {
	return (
		<Box flexDirection="column">
			{items.map((item, index) => {
				const isSelected = index === selectedIndex;
				const prefix = isSelected ? '› ' : '  ';

				return (
					<Box key={index} marginY={0}>
						<Text color={isSelected ? 'cyan' : 'white'} bold={isSelected}>
							{prefix}
							{item.label}
						</Text>
						{item.description && (
							<Box marginLeft={2}>
								<Text dimColor>- {item.description}</Text>
							</Box>
						)}
					</Box>
				);
			})}
		</Box>
	);
}
