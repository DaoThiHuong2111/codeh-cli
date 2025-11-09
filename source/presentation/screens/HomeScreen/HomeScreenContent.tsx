/**
 * HomeScreenContent - Internal layout component
 * Contains the actual UI layout with all chat components
 */

import React, {useEffect, useState} from 'react';
import {Box, useApp, useInput} from 'ink';
import {useChat} from './contexts/ChatContext';
import {useSettings} from './contexts/SettingsContext';
import {useTerminalSize} from './hooks/useTerminalSize';
import {MainContent} from './components/layout/MainContent';
import {InputBox} from './components/layout/InputBox';
import {Footer} from './components/layout/Footer';
import type {ConnectionStatus} from './components/layout/Footer';

/**
 * HomeScreenContent - Main UI layout
 */
export const HomeScreenContent: React.FC = () => {
	const {exit} = useApp();
	const {width, height} = useTerminalSize();

	// Chat state
	const {
		history,
		pendingItem,
		isStreaming,
		error,
		provider,
		sendMessage,
		cancelStream,
		clearHistory,
	} = useChat();

	// Settings state
	const {model} = useSettings();

	// Total token count
	const [totalTokens, setTotalTokens] = useState(0);

	// Calculate total tokens from history
	useEffect(() => {
		const total = history.reduce((sum, item) => {
			return sum + (item.usage?.totalTokens || 0);
		}, 0);
		setTotalTokens(total);
	}, [history]);

	// Connection status
	const connectionStatus: ConnectionStatus = error
		? 'disconnected'
		: isStreaming
			? 'streaming'
			: 'connected';

	// Handle keyboard shortcuts
	useInput((input, key) => {
		// Ctrl+C: Exit
		if (key.ctrl && input === 'c') {
			exit();
		}

		// Ctrl+L: Clear history
		if (key.ctrl && input === 'l') {
			clearHistory();
		}

		// Escape: Cancel streaming
		if (key.escape && isStreaming) {
			cancelStream();
		}
	});

	// Layout configuration
	const footerHeight = 3;
	const inputBoxHeight = 4;
	const reservedHeight = footerHeight + inputBoxHeight;

	return (
		<Box flexDirection="column" height={height}>
			{/* Main content area - chat history */}
			<MainContent
				history={history}
				pendingItem={pendingItem}
				terminalWidth={width}
				terminalHeight={height}
				reservedHeight={reservedHeight}
			/>

			{/* Input box */}
			<InputBox
				onSubmit={sendMessage}
				disabled={isStreaming}
				currentProvider={provider}
				placeholder="Type your message... (Ctrl+L: clear, Esc: cancel)"
			/>

			{/* Footer - status bar */}
			<Footer
				status={connectionStatus}
				model={model}
				tokenCount={totalTokens}
				terminalWidth={width}
			/>
		</Box>
	);
};
