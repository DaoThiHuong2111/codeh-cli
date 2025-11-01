import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {configManager, envManager} from '../services/config/index.js';

const CONFIG_SCREENS = {
	PROVIDER: 'provider',
	MODEL: 'model',
	BASE_URL: 'base_url',
	MAX_TOKEN: 'max_token',
	API_KEY: 'api_key',
};

const PROVIDERS = [
	{key: 'anthropic', label: 'anthropic'},
	{key: 'openai', label: 'openai'},
	{key: 'generic-chat-completion-api', label: 'generic-chat-completion-api'},
];

// Helper function to validate URL format
const isValidUrl = urlString => {
	try {
		const url = new URL(urlString);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
};

// Helper function to handle text input (character and backspace/delete)
const handleTextInputChange = (input, key, currentValue, setInputValue) => {
	if (input && !key.ctrl && !key.meta) {
		setInputValue(prev => prev + input);
	} else if (key.backspace || key.delete) {
		setInputValue(prev => prev.slice(0, -1));
	}
};

export default function Config({onConfigComplete}) {
	const [currentScreen, setCurrentScreen] = useState(CONFIG_SCREENS.PROVIDER);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [inputValue, setInputValue] = useState('');
	const [tempConfig, setTempConfig] = useState({
		provider: '',
		model: '',
		baseUrl: '',
		maxToken: 4096,
		apiKey: '',
	});
	const [validationError, setValidationError] = useState('');

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
			setValidationError('');
		}
	};

	const handleModelInput = (input, key) => {
		if (key.escape) {
			// Go back to provider screen
			setCurrentScreen(CONFIG_SCREENS.PROVIDER);
			setInputValue('');
			setValidationError('');
		} else if (key.return && inputValue.trim()) {
			setValidationError('');
			setTempConfig(prev => ({...prev, model: inputValue.trim()}));
			setCurrentScreen(CONFIG_SCREENS.BASE_URL);
			setInputValue('');
		} else {
			handleTextInputChange(input, key, inputValue, setInputValue);
		}
	};

	const handleBaseUrlInput = (input, key) => {
		if (key.escape) {
			// Go back to model screen and restore previously saved model
			setCurrentScreen(CONFIG_SCREENS.MODEL);
			setInputValue(tempConfig.model || '');
			setValidationError('');
		} else if (key.return && inputValue.trim()) {
			if (!isValidUrl(inputValue.trim())) {
				setValidationError('Invalid URL format. Use http:// or https://');
				return;
			}
			setValidationError('');
			setTempConfig(prev => ({...prev, baseUrl: inputValue.trim()}));
			setCurrentScreen(CONFIG_SCREENS.MAX_TOKEN);
			setInputValue('4096');
		} else {
			handleTextInputChange(input, key, inputValue, setInputValue);
		}
	};

	const handleMaxTokenInput = (input, key) => {
		if (key.escape) {
			// Go back to base URL screen
			setCurrentScreen(CONFIG_SCREENS.BASE_URL);
			setInputValue(tempConfig.baseUrl || '');
			setValidationError('');
		} else if (key.return) {
			const maxTokenValue = inputValue.trim()
				? parseInt(inputValue.trim(), 10)
				: 4096;
			setValidationError('');
			setTempConfig(prev => ({...prev, maxToken: maxTokenValue}));
			setCurrentScreen(CONFIG_SCREENS.API_KEY);
			setInputValue('');
		} else {
			handleTextInputChange(input, key, inputValue, setInputValue);
		}
	};

	const handleApiKeyInput = (input, key) => {
		if (key.escape) {
			// Go back to base URL screen and restore previously saved base URL
			setCurrentScreen(CONFIG_SCREENS.BASE_URL);
			setInputValue(tempConfig.baseUrl || '');
			setValidationError('');
		} else if (key.return) {
			// Allow empty API key (null) for APIs that don't require authentication
			const finalConfig = {
				...tempConfig,
				apiKey: inputValue.trim() || null,
			};

			// Save to config file
			configManager.addCustomModel({
				provider: finalConfig.provider,
				model: finalConfig.model,
				base_url: finalConfig.baseUrl,
				api_key: finalConfig.apiKey,
				max_token: finalConfig.maxToken,
			});

			// Also set as environment variables for immediate use
			envManager.set('CODEH_PROVIDER', finalConfig.provider);
			envManager.set('CODEH_MODEL', finalConfig.model);
			envManager.set('CODEH_BASE_URL', finalConfig.baseUrl);
			if (finalConfig.apiKey) {
				envManager.set('CODEH_MAX_TOKEN', String(finalConfig.maxToken));
				envManager.set('CODEH_API_KEY', finalConfig.apiKey);
			}

			// Reset state for potential future use
			setCurrentScreen(CONFIG_SCREENS.PROVIDER);
			setSelectedIndex(0);
			setInputValue('');
			setTempConfig({provider: '', model: '', baseUrl: '', apiKey: ''});
			setValidationError('');

			// Notify parent component that config is complete
			if (onConfigComplete) {
				onConfigComplete();
			}
		} else {
			handleTextInputChange(input, key, inputValue, setInputValue);
		}
	};

	useInput((input, key) => {
		// Handle Ctrl+C globally to exit
		if (key.ctrl && input === 'c') {
			process.exit(0);
		}

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
			case CONFIG_SCREENS.MAX_TOKEN:
				handleMaxTokenInput(input, key);
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

			{validationError && (
				<Box marginBottom={1}>
					<Text color="red">{validationError}</Text>
				</Box>
			)}

			{inputValue === '' && !validationError && (
				<Box marginBottom={1}>
					<Text color="gray">Enter your base url...</Text>
				</Box>
			)}

			<Box marginTop={1}>
				<Text color="gray">esc back ⚈ ctrl + c to exit</Text>
			</Box>
		</Box>
	);

	const renderMaxTokenScreen = () => (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				<Text color="blue" bold>
					Enter max tokens (default: 4096):
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
					<Text color="gray">Enter max tokens...</Text>
				</Box>
			)}

			{validationError && (
				<Box marginBottom={1}>
					<Text color="red">{validationError}</Text>
				</Box>
			)}

			<Box marginBottom={1}>
				<Text color="green">Press Enter to use default (4096)</Text>
			</Box>

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

			<Box marginBottom={1}>
				<Text color="green">Press Enter to not set api key (optional)</Text>
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
			case CONFIG_SCREENS.MAX_TOKEN:
				return renderMaxTokenScreen();
			case CONFIG_SCREENS.API_KEY:
				return renderApiKeyScreen();
			default:
				return renderProviderScreen();
		}
	};

	return <Box flexDirection="column">{renderScreen()}</Box>;
}
