import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Container } from '../../core/di/Container';
import { ConfigPresenter } from '../presenters/ConfigPresenter';
import Logo from '../components/atoms/Logo';
import Menu, { MenuItem } from '../components/molecules/Menu';
import InputBox from '../components/molecules/InputBox';
import { SuccessStatus, ErrorStatus } from '../components/atoms/StatusIndicator';

interface ConfigProps {
	onConfigComplete?: () => void;
	container: Container;
}

enum ConfigStep {
	PROVIDER = 'provider',
	MODEL = 'model',
	API_KEY = 'api_key',
	BASE_URL = 'base_url',
	CONFIRM = 'confirm',
}

export default function Config({ onConfigComplete, container }: ConfigProps) {
	const presenter = new ConfigPresenter();

	const [currentStep, setCurrentStep] = useState<ConfigStep>(ConfigStep.PROVIDER);
	const [selectedProvider, setSelectedProvider] = useState('');
	const [selectedModel, setSelectedModel] = useState('');
	const [apiKey, setApiKey] = useState('');
	const [baseUrl, setBaseUrl] = useState('');
	const [error, setError] = useState('');
	const [saving, setSaving] = useState(false);

	// Provider selection
	const [providerIndex, setProviderIndex] = useState(0);
	const providers = presenter.getProviders();

	// Model selection
	const [modelIndex, setModelIndex] = useState(0);
	const [availableModels, setAvailableModels] = useState<MenuItem[]>([]);

	useEffect(() => {
		if (selectedProvider) {
			const models = presenter.getDefaultModels(selectedProvider);
			setAvailableModels(
				models.map((m) => ({ label: m, value: m }))
			);
		}
	}, [selectedProvider]);

	useInput((input: string, key: any) => {
		if (saving) return;

		// Navigation
		if (key.upArrow) {
			if (currentStep === ConfigStep.PROVIDER) {
				setProviderIndex(Math.max(0, providerIndex - 1));
			} else if (currentStep === ConfigStep.MODEL) {
				setModelIndex(Math.max(0, modelIndex - 1));
			}
		} else if (key.downArrow) {
			if (currentStep === ConfigStep.PROVIDER) {
				setProviderIndex(Math.min(providers.length - 1, providerIndex + 1));
			} else if (currentStep === ConfigStep.MODEL) {
				setModelIndex(Math.min(availableModels.length - 1, modelIndex + 1));
			}
		} else if (key.return) {
			handleStepComplete();
		}
	});

	const handleStepComplete = async () => {
		setError('');

		switch (currentStep) {
			case ConfigStep.PROVIDER:
				setSelectedProvider(providers[providerIndex].value);
				setCurrentStep(ConfigStep.MODEL);
				break;

			case ConfigStep.MODEL:
				if (availableModels.length > 0) {
					setSelectedModel(availableModels[modelIndex].value);
					setCurrentStep(ConfigStep.API_KEY);
				}
				break;

			case ConfigStep.API_KEY:
				if (!apiKey && selectedProvider !== 'ollama') {
					setError('API key is required');
					return;
				}
				setCurrentStep(ConfigStep.BASE_URL);
				break;

			case ConfigStep.BASE_URL:
				setCurrentStep(ConfigStep.CONFIRM);
				break;

			case ConfigStep.CONFIRM:
				await handleSave();
				break;
		}
	};

	const handleSave = async () => {
		setSaving(true);

		try {
			const result = await presenter.saveConfiguration({
				provider: selectedProvider,
				model: selectedModel,
				apiKey: apiKey || undefined,
				baseUrl: baseUrl || undefined,
			});

			if (result.success) {
				onConfigComplete?.();
			} else {
				setError(result.error || 'Failed to save configuration');
				setSaving(false);
			}
		} catch (err: any) {
			setError(err.message);
			setSaving(false);
		}
	};

	const renderStep = () => {
		switch (currentStep) {
			case ConfigStep.PROVIDER:
				return (
					<Box flexDirection="column">
						<Text bold>Step 1: Select Provider</Text>
						<Box marginTop={1}>
							<Menu
								items={providers}
								selectedIndex={providerIndex}
							/>
						</Box>
					</Box>
				);

			case ConfigStep.MODEL:
				return (
					<Box flexDirection="column">
						<Text bold>Step 2: Select Model</Text>
						<Box marginTop={1}>
							<Menu
								items={availableModels}
								selectedIndex={modelIndex}
							/>
						</Box>
					</Box>
				);

			case ConfigStep.API_KEY:
				return (
					<Box flexDirection="column">
						<Text bold>Step 3: Enter API Key</Text>
						{selectedProvider === 'ollama' ? (
							<Box marginTop={1}>
								<Text dimColor>Ollama doesn't require an API key. Press Enter to continue.</Text>
							</Box>
						) : (
							<InputBox
								value={apiKey}
								onChange={setApiKey}
								onSubmit={() => handleStepComplete()}
								placeholder="Enter your API key..."
							/>
						)}
					</Box>
				);

			case ConfigStep.BASE_URL:
				return (
					<Box flexDirection="column">
						<Text bold>Step 4: Base URL (Optional)</Text>
						<InputBox
							value={baseUrl}
							onChange={setBaseUrl}
							onSubmit={() => handleStepComplete()}
							placeholder="Enter base URL or press Enter to skip..."
						/>
					</Box>
				);

			case ConfigStep.CONFIRM:
				return (
					<Box flexDirection="column">
						<Text bold>Confirm Configuration</Text>
						<Box marginTop={1} flexDirection="column">
							<Text>Provider: <Text color="cyan">{selectedProvider}</Text></Text>
							<Text>Model: <Text color="cyan">{selectedModel}</Text></Text>
							{apiKey && <Text>API Key: <Text color="green">***configured***</Text></Text>}
							{baseUrl && <Text>Base URL: <Text color="cyan">{baseUrl}</Text></Text>}
						</Box>
						<Box marginTop={1}>
							<Text dimColor>Press Enter to save...</Text>
						</Box>
					</Box>
				);
		}
	};

	return (
		<Box flexDirection="column" padding={1}>
			<Logo />

			<Box marginTop={1}>
				<Text bold color="yellow">Configuration Wizard</Text>
			</Box>

			<Box marginTop={1} marginBottom={1}>
				{renderStep()}
			</Box>

			{error && (
				<Box marginTop={1}>
					<ErrorStatus text={error} />
				</Box>
			)}

			{saving && (
				<Box marginTop={1}>
					<Text>Saving configuration...</Text>
				</Box>
			)}

			<Box marginTop={1}>
				<Text dimColor>Use ↑↓ to navigate • Press Enter to select • Ctrl+C to exit</Text>
			</Box>
		</Box>
	);
}
