import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';

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
}) {
	const [input, setInput] = useState(value);
	const [isFocused, setIsFocused] = useState(true);

	useEffect(() => {
		if (value !== input) {
			setInput(value);
		}
	}, [value]);

	useInput(
		(inputChar, key) => {
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
				setInput(newInput);
				onChange?.(newInput);
			}
		},
		[enabled, isFocused, input, onSubmit, onChange, multiline],
	);

	const displayText = input || placeholder;
	const textColor = input ? 'white' : 'blackBright';

	const borderChar = '─';
	const border = borderChar.repeat(width);

	return (
		<Box flexDirection="column" marginTop={1}>
			{/* Top border */}
			<Box>
				<Text dimColor>{border}</Text>
			</Box>

			{/* Input area */}
			<Box paddingLeft={1}>
				<Text color={prefixColor}>{prefix}</Text>
				<Text color={textColor}>{displayText}</Text>
				{isFocused && enabled && <Text color={prefixColor}>▊</Text>}
			</Box>

			{/* Bottom border */}
			<Box>
				<Text dimColor>{border}</Text>
			</Box>
		</Box>
	);
}
