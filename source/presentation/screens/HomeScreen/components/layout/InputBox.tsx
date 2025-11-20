/**
 * InputBox component
 * User input field for chat messages
 */

import React, {useState} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import {
	getProviderIcon,
	getProviderColor,
	THEME_COLORS,
} from '../../utils/colors';
import type {Provider} from '../../types';

export interface InputBoxProps {
	/** Callback when message is submitted */
	onSubmit: (message: string) => void;
	/** Whether input is disabled */
	disabled?: boolean;
	/** Current AI provider */
	currentProvider?: Provider;
	/** Placeholder text */
	placeholder?: string;
}

/**
 * InputBox - User input field with provider indicator
 */
export const InputBox: React.FC<InputBoxProps> = ({
	onSubmit,
	disabled = false,
	currentProvider = 'anthropic',
	placeholder = 'Type your message...',
}) => {
	const [input, setInput] = useState('');

	const handleSubmit = (value: string) => {
		const trimmed = value.trim();
		if (trimmed && !disabled) {
			onSubmit(trimmed);
			setInput('');
		}
	};

	const providerIcon = getProviderIcon(currentProvider);
	const providerColor = getProviderColor(currentProvider);

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor={disabled ? THEME_COLORS.ui.border : providerColor}
			paddingX={1}
		>
			<Box marginBottom={1}>
				<Text color={providerColor} bold>
					{providerIcon} {getProviderName(currentProvider)}
				</Text>
				{disabled && (
					<Text color={THEME_COLORS.text.muted} dimColor>
						{' '}
						(streaming...)
					</Text>
				)}
			</Box>

			<Box>
				<Text color={THEME_COLORS.text.muted}>{'› '}</Text>
				{disabled ? (
					<Text color={THEME_COLORS.text.muted} dimColor>
						{placeholder}
					</Text>
				) : (
					<TextInput
						value={input}
						onChange={setInput}
						onSubmit={handleSubmit}
						placeholder={placeholder}
					/>
				)}
			</Box>
		</Box>
	);
};

/**
 * Get human-readable provider name
 */
function getProviderName(provider: Provider): string {
	const names: Record<Provider, string> = {
		anthropic: 'Claude',
		openai: 'OpenAI',
		ollama: 'Ollama',
		generic: 'Assistant',
	};

	return names[provider] || 'Assistant';
}
