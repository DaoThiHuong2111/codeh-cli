import React from 'react';
import {Box, Text} from 'ink';

interface InfoSectionProps {
	version?: string;
	model?: string;
	directory?: string;
}

export default function InfoSection({
	version,
	model,
	directory,
}: InfoSectionProps) {
	return (
		<Box flexDirection="column" paddingLeft={2} marginBottom={1}>
			{version && (
				<Text dimColor>
					Version: <Text color="cyan">{version}</Text>
				</Text>
			)}
			{model !== undefined && (
				<Text dimColor>
					Model: <Text color="yellow">{model || '(not configured)'}</Text>
				</Text>
			)}
			{directory && (
				<Text dimColor>
					Directory: <Text color="green">{directory}</Text>
				</Text>
			)}
		</Box>
	);
}
