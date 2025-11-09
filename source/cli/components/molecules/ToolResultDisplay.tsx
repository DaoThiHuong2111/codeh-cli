/**
 * Tool Result Display
 * Shows tool execution results in chat
 */

import React, {useState} from 'react';
import {Box, Text} from 'ink';

export interface ToolResult {
	toolName: string;
	success: boolean;
	output: string;
	error?: string;
	duration?: number;
	timestamp?: Date;
}

export interface ToolResultDisplayProps {
	results: ToolResult[];
	collapsible?: boolean;
}

export default function ToolResultDisplay({
	results,
	collapsible = true,
}: ToolResultDisplayProps) {
	const [expanded, setExpanded] = useState(!collapsible);

	if (!results || results.length === 0) {
		return null;
	}

	return (
		<Box flexDirection="column" marginY={0}>
			{results.map((result, index) => (
				<Box
					key={index}
					flexDirection="column"
					borderStyle="round"
					borderColor={result.success ? 'green' : 'red'}
					padding={1}
					marginTop={index > 0 ? 1 : 0}
				>
					{/* Header */}
					<Box justifyContent="space-between">
						<Box>
							<Text color={result.success ? 'green' : 'red'} bold>
								{result.success ? '✓' : '✗'} {result.toolName}
							</Text>
						</Box>
						{result.duration !== undefined && (
							<Text dimColor>({result.duration}ms)</Text>
						)}
					</Box>

					{/* Output/Error */}
					{expanded && (
						<Box flexDirection="column" marginTop={1}>
							{result.success ? (
								<>
									<Text dimColor>Output:</Text>
									<Box paddingLeft={2} marginTop={0}>
										<Text color="green">
											{result.output.length > 200
												? result.output.substring(0, 200) + '...'
												: result.output}
										</Text>
									</Box>
								</>
							) : (
								<>
									<Text dimColor>Error:</Text>
									<Box paddingLeft={2} marginTop={0}>
										<Text color="red">{result.error || 'Unknown error'}</Text>
									</Box>
								</>
							)}
						</Box>
					)}

					{/* Collapse hint */}
					{collapsible && (
						<Box marginTop={1}>
							<Text dimColor>
								{expanded ? '▼ Showing output' : '▶ Press E to expand'}
							</Text>
						</Box>
					)}
				</Box>
			))}
		</Box>
	);
}
