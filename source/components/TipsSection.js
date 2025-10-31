import React from 'react';
import {Box, Text} from 'ink';

export default function TipsSection() {
	return (
		<Box flexDirection="column" marginTop={1} paddingLeft={2}>
			<Text bold>Tips for getting started:</Text>
			<Text>1. Ask questions, edit files, or run commands.</Text>
			<Text>2. Be specific for the best results.</Text>
			<Text>
				3. <Text color="magenta">/help</Text> for more information.
			</Text>
		</Box>
	);
}
