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

	// Format tool arguments cho dễ đọc
	const getFormattedCommand = () => {
		if (!toolArguments) {
			console.log('[DEBUG] No toolArguments provided');
			return null;
		}

		console.log('[DEBUG] toolArguments:', JSON.stringify(toolArguments));
		console.log('[DEBUG] currentTool:', currentTool);

		// Nếu là shell tool, hiển thị command
		if (currentTool === 'shell' && toolArguments.command) {
			console.log('[DEBUG] Returning shell command:', toolArguments.command);
			return toolArguments.command;
		}

		// Với các tools khác, hiển thị các arguments chính
		const mainArgs = Object.entries(toolArguments)
			.filter(([key]) => !key.startsWith('_'))
			.slice(0, 3) // Chỉ hiển thị 3 arguments đầu tiên
			.map(([key, value]) => `${key}: ${JSON.stringify(value).slice(0, 50)}`)
			.join(', ');

		console.log('[DEBUG] Returning mainArgs:', mainArgs);
		return mainArgs;
	};

	const formattedCommand = getFormattedCommand();

	// Truncate output nếu quá dài
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
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor={isExecuting ? 'blue' : 'green'}
			padding={1}
			marginY={1}
		>
			{/* Header */}
			<Box>
				<Text color={isExecuting ? 'blue' : 'green'} bold>
					{isExecuting ? '⚙️  Tool Executing' : '✅ Tool Completed'}
					{currentIteration && maxIterations && ` - Iteration ${currentIteration}/${maxIterations}`}
				</Text>
			</Box>

			{/* Current Tool */}
			{currentTool && (
				<Box marginTop={1} flexDirection="column">
					<Text>
						<Text color="cyan" bold>
							{currentTool}
						</Text>
						{toolIndex && totalTools && (
							<Text dimColor> ({toolIndex}/{totalTools})</Text>
						)}
					</Text>

					{/* Command/Arguments */}
					{formattedCommand ? (
						<Box marginLeft={2} marginTop={0}>
							<Text color="yellow">$ {formattedCommand}</Text>
						</Box>
					) : toolArguments && Object.keys(toolArguments).length === 0 ? (
						<Box marginLeft={2} marginTop={0}>
							<Text color="red" dimColor>
								⚠️  No arguments provided by LLM
							</Text>
						</Box>
					) : null}
				</Box>
			)}

			{/* Tool Output */}
			{displayOutput && (
				<Box marginTop={1} flexDirection="column">
					<Text dimColor bold>Output:</Text>
					<Box
						marginLeft={2}
						marginTop={0}
						flexDirection="column"
						borderStyle="single"
						borderColor="gray"
						paddingX={1}
					>
						<Text>{displayOutput.content}</Text>
						{displayOutput.truncated && (
							<Text dimColor>
								... ({displayOutput.totalLines - 10} more lines)
							</Text>
						)}
					</Box>
				</Box>
			)}

			{/* Status Message */}
			{message && !toolOutput && (
				<Box marginTop={1}>
					<Text dimColor>{message}</Text>
				</Box>
			)}

			{/* Warning về empty arguments */}
			{toolArguments && Object.keys(toolArguments).length === 0 && isExecuting && (
				<Box marginTop={1} borderStyle="single" borderColor="yellow" padding={1}>
					<Text color="yellow">
						⚠️  Warning: LLM called tool without arguments. This may indicate:
					</Text>
					<Box marginLeft={2} flexDirection="column">
						<Text dimColor>• Invalid model configuration (check your model name)</Text>
						<Text dimColor>• Model doesn't support tool calling properly</Text>
						<Text dimColor>• API communication issue</Text>
					</Box>
				</Box>
			)}

			{/* Progress indicator */}
			{isExecuting && (
				<Box marginTop={1}>
					<Text color="blue">● Executing...</Text>
				</Box>
			)}
		</Box>
	);
};
