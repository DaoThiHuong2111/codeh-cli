/**
 * Footer Component
 * Enhanced status bar showing session stats and information
 */

import {Box, Text} from 'ink';
import React from 'react';

export interface FooterProps {
	model: string;
	messageCount: number;
	totalTokens: number;
	estimatedCost: number;
	sessionDuration: number; // in seconds
	gitBranch?: string;
	permissionMode?: 'mvp' | 'interactive';
	sandboxEnabled?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
	model,
	messageCount,
	totalTokens,
	estimatedCost,
	sessionDuration,
	gitBranch,
	permissionMode = 'mvp',
	sandboxEnabled = true,
}) => {
	// Format duration as MM:SS
	const formatDuration = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	// Format cost
	const formatCost = (cost: number): string => {
		return `$${cost.toFixed(4)}`;
	};

	// Format tokens with thousands separator
	const formatTokens = (tokens: number): string => {
		return tokens.toLocaleString();
	};

	return (
		<Box paddingX={1} marginTop={1}>
			<Box gap={2}>
				{/* Model */}
				<Box>
					<Text color="cyan" dimColor>
						Model:{' '}
					</Text>
					<Text color="cyan">{model}</Text>
				</Box>

				{/* Separator */}
				<Text color="gray" dimColor>
					|
				</Text>

				{/* Cost */}
				<Box>
					<Text color="magenta" dimColor>
						Cost:{' '}
					</Text>
					<Text color="magenta">{formatCost(estimatedCost)}</Text>
				</Box>

				{/* Separator */}
				<Text color="gray" dimColor>
					|
				</Text>

				{/* Duration */}
				<Box>
					<Text color="blue" dimColor>
						Duration:{' '}
					</Text>
					<Text color="blue">{formatDuration(sessionDuration)}</Text>
				</Box>

				{/* Git Branch (optional) */}
				{gitBranch && (
					<>
						<Text color="gray" dimColor>
							|
						</Text>
						<Box>
							<Text color="white" dimColor>
								Branch:{' '}
							</Text>
							<Text color="white">{gitBranch}</Text>
						</Box>
					</>
				)}

				{/* Permission Mode */}
				<Text color="gray" dimColor>
					|
				</Text>
				<Box>
					<Text color={permissionMode === 'mvp' ? 'cyan' : 'green'}>
						{permissionMode === 'mvp' ? 'YOLO' : 'Ask before edits'}
					</Text>
					<Text color="gray" dimColor>
						{' '}
						(Shift+Tab)
					</Text>
				</Box>

				{/* Sandbox Status */}
				<Text color="gray" dimColor>
					|
				</Text>
				<Box>
					<Text color={sandboxEnabled ? 'green' : 'yellow'} wrap="wrap">
						{sandboxEnabled ? '🔒 Sandbox' : '⚠️  No Sandbox'}
					</Text>
				</Box>
			</Box>
		</Box>
	);
};
