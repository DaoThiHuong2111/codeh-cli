import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {configManager} from '../services/configManager.js';
import {envManager} from '../services/envManager.js';

const CONFIG_SCREENS = {
	PROVIDER: 'provider',
	MODEL: 'model',
	BASE_URL: 'base_url',
	API_KEY: 'api_key',
};

const PROVIDERS = [
	{key: 'anthropic', label: 'anthropic'},
	{key: 'openai', label: 'openai'},
	{key: 'generic-chat-completion-api', label: 'generic-chat-completion-api'},
];

export default function Config({onConfigComplete}) {
	const [currentScreen, setCurrentScreen] = useState(CONFIG_SCREENS.PROVIDER);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [inputValue, setInputValue] = useState('');
	const [tempConfig, setTempConfig] = useState({
		provider: '',
		model: '',
		baseUrl: '',
		apiKey: '',
	});

	// Handle Ctrl+C to exit
	useInput((input, key) => {
		if (key.ctrl && input === 'c') {
			process.exit(0);
		}
	});

	const handleProviderScreenInput = (_, key) => {
		if (key.upArrow) {
			setSelectedIndex(prev => Math.max(0, prev - 1));
		} else if (key.downArrow) {
			setSelectedIndex(prev => Math.min(PROVIDERS.length - 1, prev + 1));
		} else if (key.return) {
			const selectedProvider = PROVIDERS[selectedIndex];
			setTempConfig(prev => ({...prev, provider: selectedProvider.key}));
			setCurrentScreen(CONFIG_SCREENS.MODEL);
			setSelectedIndex(0);
			setInputValue('');
		}
	};

	const handleModelInput = (input, key) => {
		if (key.escape) {
			// Go back to provider screen
			setCurrentScreen(CONFIG_SCREENS.PROVIDER);
			setInputValue('');
		} else if (key.return && inputValue.trim()) {
			setTempConfig(prev => ({...prev, model: inputValue.trim()}));
			setCurrentScreen(CONFIG_SCREENS.BASE_URL);
			setInputValue('');
		} else if (input && !key.ctrl && !key.meta) {
			setInputValue(prev => prev + input);
		} else if (key.backspace || key.delete) {
			setInputValue(prev => prev.slice(0, -1));
		}
	};

	const handleBaseUrlInput = (input, key) => {
		if (key.escape) {
			// Go back to model screen
			setCurrentScreen(CONFIG_SCREENS.MODEL);
			setInputValue(tempConfig.model);
		} else if (key.return && inputValue.trim()) {
			setTempConfig(prev => ({...prev, baseUrl: inputValue.trim()}));
			setCurrentScreen(CONFIG_SCREENS.API_KEY);
			setInputValue('');
		} else if (input && !key.ctrl && !key.meta) {
			setInputValue(prev => prev + input);
		} else if (key.backspace || key.delete) {
			setInputValue(prev => prev.slice(0, -1));
		}
	};

	const handleApiKeyInput = (input, key) => {
		if (key.escape) {
			// Go back to base URL screen
			setCurrentScreen(CONFIG_SCREENS.BASE_URL);
			setInputValue(tempConfig.baseUrl);
		} else if (key.return && inputValue.trim()) {
			// Save configuration
			const finalConfig = {
				...tempConfig,
				apiKey: inputValue.trim(),
			};

			// Save to config file
			configManager.addCustomModel({
				provider: finalConfig.provider,
				model: finalConfig.model,
				base_url: finalConfig.baseUrl,
				api_key: finalConfig.apiKey,
			});

			// Also set as environment variables for immediate use
			envManager.set('CODEH_PROVIDER', finalConfig.provider);
			envManager.set('CODEH_MODEL', finalConfig.model);
			envManager.set('CODEH_BASE_URL', finalConfig.baseUrl);
			envManager.set('CODEH_API_KEY', finalConfig.apiKey);

			// Reset and exit config
			setCurrentScreen(CONFIG_SCREENS.PROVIDER);
			setSelectedIndex(0);
			setInputValue('');
			setTempConfig({provider: '', model: '', baseUrl: '', apiKey: ''});

			// Notify parent component that config is complete
			if (onConfigComplete) {
				onConfigComplete();
			}
		} else if (input && !key.ctrl && !key.meta) {
			setInputValue(prev => prev + input);
		} else if (key.backspace || key.delete) {
			setInputValue(prev => prev.slice(0, -1));
		}
	};

	useInput((input, key) => {
		switch (currentScreen) {
			case CONFIG_SCREENS.PROVIDER:
				handleProviderScreenInput(input, key);
				break;
			case CONFIG_SCREENS.MODEL:
				handleModelInput(input, key);
				break;
			case CONFIG_SCREENS.BASE_URL:
				handleBaseUrlInput(input, key);
				break;
			case CONFIG_SCREENS.API_KEY:
				handleApiKeyInput(input, key);
				break;
		}
	});

	const renderProviderScreen = () => (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				<Text color="blue" bold>
					Select your provider:
				</Text>
			</Box>

			<Box flexDirection="column">
				{PROVIDERS.map((provider, index) => (
					<Box key={provider.key} marginBottom={1}>
						<Box marginRight={2}>
							<Text color={index === selectedIndex ? 'green' : 'white'}>
								{index === selectedIndex ? '▶' : ' '}
							</Text>
						</Box>
						<Text color={index === selectedIndex ? 'green' : 'white'}>
							{index + 1}. {provider.label}
						</Text>
					</Box>
				))}
			</Box>

			<Box marginTop={1}>
				<Text color="gray">↑/↓ choose ⚈ enter accept ⚈ ctrl + c to exit</Text>
			</Box>
		</Box>
	);

	const renderModelScreen = () => (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				<Text color="blue" bold>
					Enter your model:
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text color="yellow">
					{inputValue || ' '}
					<Text backgroundColor="yellow">█</Text>
				</Text>
			</Box>

			{inputValue === '' && (
				<Box marginBottom={1}>
					<Text color="gray">Enter your model...</Text>
				</Box>
			)}

			<Box marginTop={1}>
				<Text color="gray">esc back ⚈ ctrl + c to exit</Text>
			</Box>
		</Box>
	);

	const renderBaseUrlScreen = () => (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				<Text color="blue" bold>
					Enter your base url:
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text color="yellow">
					{inputValue || ' '}
					<Text backgroundColor="yellow">█</Text>
				</Text>
			</Box>

			{inputValue === '' && (
				<Box marginBottom={1}>
					<Text color="gray">Enter your base url...</Text>
				</Box>
			)}

			<Box marginTop={1}>
				<Text color="gray">esc back ⚈ ctrl + c to exit</Text>
			</Box>
		</Box>
	);

	const renderApiKeyScreen = () => (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				<Text color="blue" bold>
					Enter your api key:
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text color="yellow">
					{inputValue || ' '}
					<Text backgroundColor="yellow">█</Text>
				</Text>
			</Box>

			{inputValue === '' && (
				<Box marginBottom={1}>
					<Text color="gray">Enter your api key...</Text>
				</Box>
			)}

			<Box marginBottom={1}>
				<Text color="cyan">
					this will be written to the global configuration file:
					~/.codeh/configs.json
				</Text>
			</Box>

			<Box marginTop={1}>
				<Text color="gray">esc back ⚈ ctrl + c to exit</Text>
			</Box>
		</Box>
	);

	const renderScreen = () => {
		switch (currentScreen) {
			case CONFIG_SCREENS.PROVIDER:
				return renderProviderScreen();
			case CONFIG_SCREENS.MODEL:
				return renderModelScreen();
			case CONFIG_SCREENS.BASE_URL:
				return renderBaseUrlScreen();
			case CONFIG_SCREENS.API_KEY:
				return renderApiKeyScreen();
			default:
				return renderProviderScreen();
		}
	};

	return <Box flexDirection="column">{renderScreen()}</Box>;
}
