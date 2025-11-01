import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import InputBox from '../components/InputBox.js';
import {processUserInput} from '../services/input/index.js';
import Logo from '../components/Logo.js';
import InfoSection from '../components/InfoSection.js';
import TipsSection from '../components/TipsSection.js';
import {getVersion, getCurrentDirectory} from '../services/system/index.js';
import {getModel} from '../services/config/index.js';

export default function Home() {
	const version = getVersion();
	const model = getModel();
	const directory = getCurrentDirectory();

	const [input, setInput] = useState('');
	const [history, setHistory] = useState([]);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async userInput => {
		if (!userInput.trim()) return;

		setHistory(prev => [...prev, {type: 'user', content: userInput}]);
		setInput('');
		setIsLoading(true);

		try {
			const response = await processUserInput(userInput);
			setHistory(prev => [...prev, {type: 'assistant', content: response}]);
		} catch (error) {
			setHistory(prev => [...prev, {type: 'error', content: error.message}]);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Box flexDirection="column" paddingY={1}>
			<Logo />

			<InfoSection version={version} model={model} directory={directory} />
			<TipsSection />

			<InputBox
				value={input}
				onChange={setInput}
				onSubmit={handleSubmit}
				placeholder="Prompt here (Ctrl+C để thoát)..."
			/>
		</Box>
	);
}
