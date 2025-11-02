import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Container } from '../../core/di/Container';
import { useCodehClient } from '../hooks/useCodehClient';
import { useCodehChat } from '../hooks/useCodehChat';
import { usePresenter } from '../hooks/usePresenter';
import { HomePresenter } from '../presenters/HomePresenter';
import InputBox from '../components/molecules/InputBox';
import InfoSection from '../components/molecules/InfoSection';
import TipsSection from '../components/molecules/TipsSection';
import Logo from '../components/atoms/Logo';

interface HomeProps {
	container: Container;
}

export default function Home({ container }: HomeProps) {
	const { client, loading: clientLoading, error: clientError } = useCodehClient(container);
	const { chat, loading: chatLoading, error: chatError } = useCodehChat(container);
	const presenter = usePresenter(HomePresenter, client, chat);

	const [output, setOutput] = useState('');
	const [processing, setProcessing] = useState(false);
	const [version] = useState('1.0.0');
	const [model, setModel] = useState('');
	const [directory] = useState(process.cwd());

	useEffect(() => {
		// Load model from config
		const loadModel = async () => {
			try {
				const { ConfigLoader } = await import('../../infrastructure/config/ConfigLoader.js');
				const loader = new ConfigLoader();
				const config = await loader.load();
				setModel(config.model);
			} catch (error) {
				console.error('Failed to load model:', error);
			}
		};

		loadModel();
	}, []);

	const handleInput = async (input: string) => {
		if (!presenter || processing) return;

		setProcessing(true);
		setOutput('Thinking...');

		try {
			const result = await presenter.handleInput(input);

			if (result.success) {
				setOutput(result.output);
			} else {
				setOutput(`❌ Error: ${result.error || 'Unknown error'}`);
			}
		} catch (error: any) {
			setOutput(`❌ Error: ${error.message}`);
		} finally {
			setProcessing(false);
		}
	};

	if (clientLoading || chatLoading) {
		return (
			<Box flexDirection="column">
				<Logo />
				<Box marginTop={1}>
					<Text>Loading...</Text>
				</Box>
			</Box>
		);
	}

	if (clientError || chatError) {
		return (
			<Box flexDirection="column">
				<Logo />
				<Box marginTop={1}>
					<Text color="red">Error: {clientError || chatError}</Text>
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
