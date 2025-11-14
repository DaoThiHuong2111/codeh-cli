/**
 * Tool Call Display
 * Shows tool execution request in chat
 */

import React, {useState} from 'react';
import {Box, Text} from 'ink';

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

	if (!toolCalls || toolCalls.length === 0) {
		return null;
	}

	const statusIcon = {
		pending: '⏳',
		executing: '⚙️ ',
		completed: '✅',
		failed: '',
	}[status];

	const statusColor = {
		pending: 'yellow',
		executing: 'blue',
		completed: 'green',
		failed: 'red',
	}[status];

	const statusText = {
		pending: 'Pending',
		executing: 'Executing',
		completed: 'Completed',
		failed: 'Failed',
	}[status];

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor={statusColor}
			padding={1}
			marginY={0}
		>
			{/* Header */}
			<Box>
				<Text color={statusColor} bold>
					{statusIcon} Tool Execution - {statusText}
				</Text>
			</Box>

			{/* Tool List */}
			{toolCalls.map((toolCall, index) => (
				<Box key={toolCall.id} flexDirection="column" marginTop={1}>
					<Box>
						<Text dimColor>#{index + 1} </Text>
						<Text bold color="cyan">
							{toolCall.name}
						</Text>
					</Box>

					{/* Arguments (expandable) */}
					{expanded && (
						<Box paddingLeft={2} marginTop={0}>
							<Text color="gray">
								{JSON.stringify(toolCall.arguments, null, 2)}
							</Text>
						</Box>
					)}
				</Box>
			))}

			{/* Expand hint */}
			<Box marginTop={1}>
				<Text dimColor>
					{expanded ? '▼ Details shown' : '▶ Press E to expand details'}
				</Text>
			</Box>
		</Box>
	);
}
