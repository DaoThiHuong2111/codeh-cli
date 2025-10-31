import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import InputBox from '../components/InputBox.js';
import {processUserInput} from '../services/inputHandler.js';

export default function Home() {
	const [input, setInput] = useState('');
	const [history, setHistory] = useState([]);
	const [isLoading, setIsLoading] = useState(false);

	useInput((input, key) => {
		if (key.escape) {
			process.exit(0);
		}
	});

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
			<Box marginBottom={1}>
				<Text color="blue" bold>
					CodeH CLI - Home
				</Text>
			</Box>

			<Box flexDirection="column" marginBottom={1}>
				{history.map((item, index) => (
					<Box key={index} marginBottom={1}>
						<Text
							color={
								item.type === 'user'
									? 'green'
									: item.type === 'error'
									? 'red'
									: 'white'
							}
						>
							{item.type === 'user'
								? '> '
								: item.type === 'assistant'
								? '🤖 '
								: '❌ '}
							{item.content}
						</Text>
					</Box>
				))}
				{isLoading && (
					<Box>
						<Text color="yellow">Đang xử lý...</Text>
					</Box>
				)}
			</Box>

			<InputBox
				value={input}
				onChange={setInput}
				onSubmit={handleSubmit}
				placeholder="Nhập lệnh hoặc câu hỏi của bạn (ESC để thoát)..."
			/>
		</Box>
	);
}
