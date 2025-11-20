/**
 * Tool Execution Progress
 * Shows real-time progress of tool execution
 */

import React from 'react';
import {Box, Text} from 'ink';

export interface ToolExecutionProgressProps {
	isExecuting: boolean;
	currentIteration?: number;
	maxIterations?: number;
	currentTool?: string;
	toolArguments?: Record<string, any>;
	toolOutput?: string;
	toolIndex?: number;
	totalTools?: number;
	message?: string;
}

export const ToolExecutionProgress: React.FC<ToolExecutionProgressProps> = ({
	isExecuting,
	currentIteration,
	maxIterations,
	currentTool,
	toolArguments,
	toolOutput,
	toolIndex,
	totalTools,
	message,
}) => {
	if (!isExecuting && !message && !toolOutput) {
		return null;
	}

	const getFormattedCommand = () => {
		if (!toolArguments) {
			return null;
		}
		if (currentTool === 'shell' && toolArguments.command) {
			return toolArguments.command;
		}

		const mainArgs = Object.entries(toolArguments)
			.filter(([key]) => !key.startsWith('_'))
			.slice(0, 3)
			.map(([key, value]) => `${key}: ${JSON.stringify(value).slice(0, 50)}`)
			.join(', ');

		return mainArgs;
	};

	const formattedCommand = getFormattedCommand();

	const getDisplayOutput = () => {
		if (!toolOutput) return null;

		const maxLines = 10;
		const lines = toolOutput.split('\n');

		if (lines.length > maxLines) {
			return {
				content: lines.slice(0, maxLines).join('\n'),
				truncated: true,
				totalLines: lines.length,
			};
		}

		return {
			content: toolOutput,
			truncated: false,
			totalLines: lines.length,
		};
	};

	const displayOutput = getDisplayOutput();

	return (
		<Box flexDirection="column" marginY={0}>
			{currentTool && (
				<Box>
					<Text dimColor wrap="wrap">
						{isExecuting ? '> ' : '✓ '}
						{currentTool}
						{toolIndex && totalTools && ` (${toolIndex}/${totalTools})`}
						{formattedCommand && ` ${formattedCommand}`}
					</Text>
				</Box>
			)}

			{displayOutput && (
				<Box marginLeft={2} flexDirection="column">
					<Text dimColor wrap="wrap">{displayOutput.content}</Text>
					{displayOutput.truncated && (
						<Text dimColor wrap="wrap">
							... +{displayOutput.totalLines - 10} lines
						</Text>
					)}
				</Box>
			)}

			{message && !toolOutput && (
				<Box>
					<Text dimColor wrap="wrap">{message}</Text>
				</Box>
			)}
		</Box>
	);
};
