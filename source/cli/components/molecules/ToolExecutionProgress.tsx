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
	toolIndex?: number;
	totalTools?: number;
	message?: string;
}

export const ToolExecutionProgress: React.FC<ToolExecutionProgressProps> = ({
	isExecuting,
	currentIteration,
	maxIterations,
	currentTool,
	toolIndex,
	totalTools,
	message,
}) => {
	if (!isExecuting && !message) {
		return null;
	}

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="blue"
			padding={1}
			marginY={1}
		>
			{/* Header */}
			<Box>
				<Text color="blue" bold>
					⚙️  Tool Execution
					{currentIteration && maxIterations && ` - Iteration ${currentIteration}/${maxIterations}`}
				</Text>
			</Box>

			{/* Current Tool */}
			{currentTool && (
				<Box marginTop={1}>
					<Text>
						<Text color="cyan" bold>
							{currentTool}
						</Text>
						{toolIndex && totalTools && (
							<Text dimColor> ({toolIndex}/{totalTools})</Text>
						)}
					</Text>
				</Box>
			)}

			{/* Status Message */}
			{message && (
				<Box marginTop={1}>
					<Text dimColor>{message}</Text>
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
