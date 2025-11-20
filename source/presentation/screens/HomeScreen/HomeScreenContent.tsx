/**
 * HomeScreenContent - Internal layout component
 * Contains the actual UI layout with all chat components
 */

import React, {useEffect, useState} from 'react';
import {Box} from 'ink';
import {useChat} from './contexts/ChatContext';
import {useSettings} from './contexts/SettingsContext';
import {useTerminalSize} from './hooks/useTerminalSize';
import {MainContent} from './components/layout/MainContent';
import {InputBox} from './components/layout/InputBox';
import {Footer} from './components/layout/Footer';
import {useShortcut} from '../../../core/input/index.js';
import type {ConnectionStatus} from './components/layout/Footer';

/**
 * HomeScreenContent - Main UI layout
 */
export const HomeScreenContent: React.FC = () => {
	const {width, height} = useTerminalSize();

	const {
		history,
		pendingItem,
		isStreaming,
		error,
		provider,
		sendMessage,
		cancelStream,
	} = useChat();

	const {model} = useSettings();

	const [totalTokens, setTotalTokens] = useState(0);

	useEffect(() => {
		const total = history.reduce((sum, item) => {
			return sum + (item.usage?.totalTokens || 0);
		}, 0);
		setTotalTokens(total);
	}, [history]);

	const connectionStatus: ConnectionStatus = error
		? 'disconnected'
		: isStreaming
			? 'streaming'
			: 'connected';

	useShortcut({
		key: 'escape',
		handler: () => {
			if (isStreaming) {
				cancelStream();
			}
		},
		layer: 'screen',
		enabled: () => isStreaming,
		description: 'Cancel stream',
		source: 'HomeScreenContent',
	});

	const footerHeight = 3;
	const inputBoxHeight = 4;
	const reservedHeight = footerHeight + inputBoxHeight;

	return (
		<Box flexDirection="column" height={height}>
			<MainContent
				history={history}
				pendingItem={pendingItem}
				terminalWidth={width}
				terminalHeight={height}
				reservedHeight={reservedHeight}
			/>

			<InputBox
				onSubmit={sendMessage}
				disabled={isStreaming}
				currentProvider={provider}
				placeholder="Type your message... (Esc: cancel)"
			/>

			<Footer
				status={connectionStatus}
				model={model}
				tokenCount={totalTokens}
				terminalWidth={width}
			/>
		</Box>
	);
};
