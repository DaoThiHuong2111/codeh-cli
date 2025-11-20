/**
 * Footer Component
 * Enhanced status bar showing session stats and information
 */

import {Box, Text} from 'ink';
import React from 'react';

export interface FooterProps {
	model: string;
	gitBranch?: string;
	directory?: string;
	sessionDuration: number;
	permissionMode?: 'mvp' | 'interactive';
	sandboxEnabled?: boolean;
	sandboxAvailable?: boolean; // Whether Dockerfile exists in current directory
}

export const Footer: React.FC<FooterProps> = ({
	model,
	sessionDuration,
	directory,
	gitBranch,
	permissionMode = 'mvp',
	sandboxEnabled = false,
	sandboxAvailable = false,
}) => {
	// Format duration as MM:SS
	const formatDuration = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	return (
		<Box paddingX={1} marginTop={1}>
			<Box flexWrap="wrap">
				{/* Model */}
				<Box>
					<Text>Model: </Text>
					<Text>{model}</Text>
				</Box>

				{/* Directory */}
				<Text> | </Text>
				<Box>
					<Text>{directory}</Text>
				</Box>

				{/* Git Branch (optional) */}
				{gitBranch && (
					<>
						<Text> | </Text>
						<Box>
							<Text>Branch: </Text>
							<Text>{gitBranch}</Text>
						</Box>
					</>
				)}

				{/* Permission Mode */}
				<Text>|</Text>
				<Box>
					<Text>{permissionMode === 'mvp' ? 'YOLO' : 'Ask before edits'}</Text>
					<Text> (Shift+Tab)</Text>
				</Box>

				{/* Sandbox Status */}
				<Text> | </Text>
				<Box>
					{!sandboxAvailable ? (
						<Text dimColor>No Sandbox</Text>
					) : sandboxEnabled ? (
						<Text color="cyan">Docker (Isolated)</Text>
					) : (
						<Text>No Sandbox</Text>
					)}
				</Box>
				{/* Duration */}
				<Box>
					<Text> | </Text>

					<Text>Duration: </Text>
					<Text>{formatDuration(sessionDuration)}</Text>
				</Box>
			</Box>
		</Box>
	);
};
