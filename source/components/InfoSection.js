import React from 'react';
import {Box, Text} from 'ink';

export default function InfoSection({version, model, directory}) {
	return (
		<Box flexDirection="column" marginTop={1} paddingLeft={2}>
			<Text dimColor>
				Version: <Text color="cyan">{version}</Text>
			</Text>
			<Text dimColor>
				Model: <Text color="yellow">{model || '(not configured)'}</Text>
			</Text>
			<Text dimColor>
				Directory: <Text color="green">{directory}</Text>
			</Text>
		</Box>
	);
}
