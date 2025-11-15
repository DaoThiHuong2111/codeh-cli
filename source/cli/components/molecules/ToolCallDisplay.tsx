/**
 * Tool Call Display
 * Shows tool execution request in chat
 */

import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';

export interface ToolCall {
	id: string;
	name: string;
	arguments: Record<string, any>;
}

export interface ToolCallDisplayProps {
	toolCalls: ToolCall[];
	status?: 'pending' | 'executing' | 'completed' | 'failed';
}

export default function ToolCallDisplay({
	toolCalls,
	status = 'pending',
}: ToolCallDisplayProps) {
	const [expanded, setExpanded] = useState(false);

	// Handle keyboard input to toggle expansion
	useInput((input, key) => {
		if (input.toLowerCase() === 'e' && key.ctrl) {
			setExpanded(prev => !prev);
		}
	});

	if (!toolCalls || toolCalls.length === 0) {
		return null;
	}

	const statusIcon = {
		pending: '>',
		executing: '>',
		completed: '✓',
		failed: '✗',
	}[status];

	return (
		<Box flexDirection="column" marginY={0}>
			{/* Tool List - minimal */}
			{toolCalls.map((toolCall, index) => (
				<Box key={toolCall.id} flexDirection="column">
					<Box>
						<Text dimColor wrap="wrap">
							{statusIcon} {toolCall.name}
							{toolCalls.length > 1 && ` (${index + 1}/${toolCalls.length})`}
						</Text>
					</Box>

					{/* Arguments (expandable) */}
					{expanded && (
						<Box paddingLeft={2}>
							<Text dimColor wrap="wrap">
								{JSON.stringify(toolCall.arguments, null, 2)}
							</Text>
						</Box>
					)}
				</Box>
			))}

			{/* Expand hint - minimal */}
			{!expanded && (
				<Box>
					<Text dimColor wrap="wrap">Ctrl+E for details</Text>
				</Box>
			)}
		</Box>
	);
}
