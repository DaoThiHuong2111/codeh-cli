import React from 'react';
import { Box, Text } from 'ink';
import { Container } from '../../core/di/Container';
import { useHomeLogic } from '../hooks/useHomeLogic';
import InputBox from '../components/molecules/InputBox';
import InfoSection from '../components/molecules/InfoSection';
import TipsSection from '../components/molecules/TipsSection';
import Logo from '../components/atoms/Logo';

interface HomeProps {
	container: Container;
}

export default function Home({ container }: HomeProps) {
	// Business logic hook
	const {
		output,
		processing,
		version,
		model,
		directory,
		chatError,
		handleInput,
	} = useHomeLogic(container);

	// Show chat loading error but don't block the UI
	if (chatError) {
		return (
			<Box flexDirection="column">
				<Logo />
				<Box marginTop={1}>
					<Text color="red">Error loading chat: {chatError}</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Logo />

			<InfoSection version={version} model={model} directory={directory} />

			<TipsSection />

			<InputBox
				onSubmit={handleInput}
				placeholder="Ask me anything..."
				enabled={!processing}
			/>

			{output && (
				<Box marginTop={1} flexDirection="column">
					<Text>{output}</Text>
				</Box>
			)}

			<Box marginTop={1}>
				<Text dimColor>Press Ctrl+C to exit</Text>
			</Box>
		</Box>
	);
}
