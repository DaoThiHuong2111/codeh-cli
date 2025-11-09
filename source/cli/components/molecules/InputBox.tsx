import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';

interface InputBoxProps {
	value?: string;
	onChange?: (value: string) => void;
	onSubmit?: (value: string) => void;
	placeholder?: string;
	prefix?: string;
	prefixColor?: string;
	width?: number;
	multiline?: boolean;
	enabled?: boolean;
	maxLength?: number; // Max character limit (default: 4000)
	showCounter?: boolean; // Show character counter (default: true)
}

export default function InputBox({
	value = '',
	onChange,
	onSubmit,
	placeholder = '',
	prefix = '> ',
	prefixColor = 'cyan',
	width = 80,
	multiline = false,
	enabled = true,
	maxLength = 4000,
	showCounter = true,
}: InputBoxProps) {
	const [input, setInput] = useState(value);
	const [isFocused, setIsFocused] = useState(true);

	useEffect(() => {
		if (value !== input) {
			setInput(value);
		}
	}, [value]);

	useInput(
		(inputChar: string, key: any) => {
			if (!enabled || !isFocused) return;

			if (key.return) {
				if (input.trim()) {
					onSubmit?.(input);
					if (!multiline) {
						setInput('');
					}
				}
			} else if (key.backspace || key.delete) {
				setInput(input.slice(0, -1));
				onChange?.(input.slice(0, -1));
			} else if (!key.ctrl && !key.meta && inputChar) {
				const newInput = input + inputChar;
				// Enforce max length if set
				if (maxLength && newInput.length > maxLength) {
					return; // Don't allow input beyond max length
				}
				setInput(newInput);
				onChange?.(newInput);
			}
		},
		{isActive: enabled && isFocused},
	);

	const displayText = input || placeholder;
	const textColor = input ? 'white' : 'gray';
	const isPlaceholder = !input;

	const borderChar = '─';
	const border = borderChar.repeat(width);

	// Calculate character counter display
	const charCount = input.length;
	const charPercentage = maxLength ? (charCount / maxLength) * 100 : 0;

	// Determine counter color based on usage
	let counterColor = 'gray';
	if (charPercentage > 95) {
		counterColor = 'red'; // Danger: >95%
	} else if (charPercentage > 80) {
		counterColor = 'yellow'; // Warning: >80%
	}

	return (
		<Box flexDirection="column" marginTop={1}>
			{/* Top border */}
			<Box>
				<Text dimColor>{border}</Text>
			</Box>

			{/* Input area */}
			<Box paddingLeft={1}>
				<Text color={prefixColor}>{prefix}</Text>
				<Text color={textColor} dimColor={isPlaceholder}>
					{displayText}
				</Text>
				{isFocused && enabled && <Text color={prefixColor}>▊</Text>}
			</Box>

			{/* Bottom border */}
			<Box>
				<Text dimColor>{border}</Text>
			</Box>

			{/* Character counter */}
			{showCounter && (
				<Box paddingLeft={1} marginTop={0}>
					<Text color={counterColor} dimColor={charPercentage <= 80}>
						{charCount}/{maxLength} characters
					</Text>
					{charPercentage > 80 && (
						<Text color={counterColor}>
							{' '}
							(
							{charPercentage > 95
								? '⚠️ Limit reached!'
								: '⚠️ Approaching limit'}
							)
						</Text>
					)}
				</Box>
			)}
		</Box>
	);
}
