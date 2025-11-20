import React, {useState, useEffect} from 'react';
import {Box, Text, useInput, useStdout} from 'ink';
import {useLayerSwitch} from '../../../core/input/index.js';

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
	maxLength?: number; // Max character limit (default: Infinity)
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
	maxLength = Infinity,
	showCounter = false,
}: InputBoxProps) {
	const [input, setInput] = useState(value);
	const [isFocused, setIsFocused] = useState(true);
	const {stdout} = useStdout();
	const terminalWidth = stdout?.columns || 80;

	useEffect(() => {
		if (value !== input) {
			setInput(value);
		}
	}, [value]);

	useLayerSwitch('input', enabled && isFocused, 'screen');

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
	const border = borderChar.repeat(terminalWidth - 2);

	const charCount = input.length;
	const charPercentage = maxLength ? (charCount / maxLength) * 100 : 0;

	let counterColor = 'gray';
	if (charPercentage > 95) {
		counterColor = 'red';
	} else if (charPercentage > 80) {
		counterColor = 'yellow';
	}

	return (
		<Box flexDirection="column" marginTop={1}>
			<Box>
				<Text dimColor>{border}</Text>
			</Box>

			<Box paddingLeft={1}>
				<Text color={prefixColor}>{prefix}</Text>
				{input ? (
					<>
						<Text color="white">{input}</Text>
						{isFocused && enabled && <Text color={prefixColor}>▊</Text>}
					</>
				) : (
					<>
						{isFocused && enabled && <Text color={prefixColor}>▊</Text>}
						<Text color="gray" dimColor>
							{placeholder}
						</Text>
					</>
				)}
			</Box>

			<Box>
				<Text dimColor>{border}</Text>
			</Box>

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
