import React from 'react';
import {Box, Text} from 'ink';
import {Container} from '../../core/di/Container';
import {useNavigation} from '../contexts/NavigationContext';
import {useConfigWizard, ConfigStep} from '../hooks/useConfigWizard';
import {useConfigKeyboard} from '../hooks/useConfigKeyboard';
import Logo from '../components/atoms/Logo';
import Menu from '../components/molecules/Menu';
import InputBox from '../components/molecules/InputBox';

interface ConfigProps {
	onConfigComplete?: () => void;
	container: Container;
	exitConfirmation?: boolean;
}

export default function Config({
	onConfigComplete,
	container,
	exitConfirmation,
}: ConfigProps) {
	const {navigateTo} = useNavigation();

	// Business logic hook
	const wizard = useConfigWizard();

	// Keyboard navigation hook
	useConfigKeyboard({
		currentStep: wizard.currentStep,
		saving: wizard.saving,
		providerIndex: wizard.providerIndex,
		confirmIndex: wizard.confirmIndex,
		providersLength: wizard.providers.length,
		confirmOptionsLength: wizard.confirmOptions.length,
		onNavigateHome: () => navigateTo('home'),
		onGoBack: wizard.goBack,
		onProviderIndexChange: wizard.setProviderIndex,
		onConfirmIndexChange: wizard.setConfirmIndex,
		onComplete: async () => {
			if (wizard.currentStep === ConfigStep.CONFIRM) {
				const selectedOption = wizard.confirmOptions[wizard.confirmIndex].value;
				if (selectedOption === 'save') {
					await wizard.save(() => {
						onConfigComplete?.();
						navigateTo('home');
					});
				} else if (selectedOption === 'edit') {
					wizard.goBack(ConfigStep.PROVIDER);
					wizard.setConfirmIndex(0);
				}
			} else {
				await wizard.completeStep();
			}
		},
	});

	// Render methods
	const renderStep = () => {
		switch (wizard.currentStep) {
			case ConfigStep.PROVIDER:
				return (
					<Box flexDirection="column">
						<Text bold>Step 1: Select Provider</Text>
						<Box marginTop={1}>
							<Menu
								items={wizard.providers}
								selectedIndex={wizard.providerIndex}
							/>
						</Box>
					</Box>
				);

			case ConfigStep.MODEL:
				return (
					<Box flexDirection="column">
						<Text bold>Step 2: Enter Model</Text>
						{wizard.error && (
							<Box marginTop={1}>
								<Text color="red">{wizard.error}</Text>
							</Box>
						)}
						<Box marginTop={1}>
							<InputBox
								value={wizard.selectedModel}
								onChange={wizard.setSelectedModel}
								onSubmit={() => wizard.completeStep()}
								placeholder="Enter model name..."
							/>
						</Box>
					</Box>
				);

			case ConfigStep.API_KEY:
				return (
					<Box flexDirection="column">
						<Text bold>Step 3: Enter API Key</Text>
						{wizard.selectedProvider === 'ollama' ? (
							<Box marginTop={1}>
								<Text dimColor>
									Ollama doesn't require an API key. Press Enter to continue.
								</Text>
							</Box>
						) : (
							<InputBox
								value={wizard.apiKey}
								onChange={wizard.setApiKey}
								onSubmit={() => wizard.completeStep()}
								placeholder="Enter your API key..."
							/>
						)}
					</Box>
				);

			case ConfigStep.BASE_URL:
				return (
					<Box flexDirection="column">
						<Text bold>Step 4: Base URL (Optional)</Text>
						{wizard.error && (
							<Box marginTop={1}>
								<Text color="red">{wizard.error}</Text>
							</Box>
						)}
						<InputBox
							value={wizard.baseUrl}
							onChange={wizard.setBaseUrl}
							onSubmit={() => wizard.completeStep()}
							placeholder="Enter base URL or press Enter to skip..."
						/>
					</Box>
				);

			case ConfigStep.MAX_TOKENS:
				return (
					<Box flexDirection="column">
						<Text bold>Step 5: Max Tokens</Text>
						{wizard.error && (
							<Box marginTop={1}>
								<Text color="red">{wizard.error}</Text>
							</Box>
						)}
						<Box marginTop={1}>
							<InputBox
								value={wizard.maxTokens}
								onChange={wizard.setMaxTokens}
								onSubmit={() => wizard.completeStep()}
								placeholder="Enter max tokens..."
							/>
						</Box>
					</Box>
				);

			case ConfigStep.CONFIRM:
				return (
					<Box flexDirection="column">
						<Text bold>Confirm Configuration</Text>
						<Box marginTop={1} flexDirection="column">
							<Text>
								Provider: <Text color="cyan">{wizard.selectedProvider}</Text>
							</Text>
							<Text>
								Model: <Text color="cyan">{wizard.selectedModel}</Text>
							</Text>
							{wizard.apiKey && (
								<Text>
									API Key: <Text color="green">***configured***</Text>
								</Text>
							)}
							{wizard.baseUrl && (
								<Text>
									Base URL: <Text color="cyan">{wizard.baseUrl}</Text>
								</Text>
							)}
							<Text>
								Max Tokens: <Text color="cyan">{wizard.maxTokens}</Text>
							</Text>
						</Box>
						<Box marginTop={1}>
							<Menu
								items={wizard.confirmOptions}
								selectedIndex={wizard.confirmIndex}
							/>
						</Box>
					</Box>
				);
		}
	};

	return (
		<Box flexDirection="column" padding={1}>
			<Logo />
			<Box marginTop={1}>
				<Text bold color="yellow">
					Configuration Wizard
				</Text>
			</Box>
			<Box marginTop={1} marginBottom={1}>
				{renderStep()}
			</Box>
			{wizard.saving && (
				<Box marginTop={1}>
					<Text>Saving configuration...</Text>
				</Box>
			)}
			<Box marginTop={1}>
				{wizard.currentStep === ConfigStep.PROVIDER ||
				wizard.currentStep === ConfigStep.CONFIRM ? (
					<Text dimColor>
						Use ↑↓ to navigate • Press Enter to select • ESC to go back
					</Text>
				) : (
					<Text dimColor>Press Enter to select • ESC to go back</Text>
				)}
			</Box>

			{/* Help Hint */}
			<Box>
				{exitConfirmation ? (
					<Text>Press Ctrl+C again to exit</Text>
				) : (
					<Text dimColor>Press Ctrl+C to exit</Text>
				)}
			</Box>
		</Box>
	);
}
