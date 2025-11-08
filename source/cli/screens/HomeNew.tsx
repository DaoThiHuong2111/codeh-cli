import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Container } from '../../core/di/Container.js';
import { useHomeLogicNew } from '../hooks/useHomeLogicNew.js';
import InputBox from '../components/molecules/InputBox.js';
import InfoSection from '../components/molecules/InfoSection.js';
import TipsSection from '../components/molecules/TipsSection.js';
import Logo from '../components/atoms/Logo.js';
import { ConversationArea } from '../components/organisms/ConversationArea.js';
import { SlashSuggestions } from '../components/organisms/SlashSuggestions.js';

interface HomeNewProps {
	container: Container;
}

export default function HomeNew({ container }: HomeNewProps) {
	const { presenter, loading, error } = useHomeLogicNew(container);

	// Global keyboard shortcuts
	useInput((input, key) => {
		if (!presenter) return;

		// Navigate suggestions (when typing slash command)
		if (presenter.hasSuggestions()) {
			if (key.upArrow) {
				presenter.handleSuggestionNavigate('up');
			} else if (key.downArrow) {
				presenter.handleSuggestionNavigate('down');
			} else if (key.return || key.tab) {
				presenter.handleSuggestionSelect();
			}
		}
	});

	// Loading state
	if (loading) {
		return (
			<Box flexDirection="column">
				<Logo />
				<Box marginTop={1}>
					<Text color="cyan">Loading...</Text>
				</Box>
			</Box>
		);
	}

	// Error state
	if (error || !presenter) {
		return (
			<Box flexDirection="column">
				<Logo />
				<Box marginTop={1}>
					<Text color="red">Error: {error || 'Failed to initialize'}</Text>
				</Box>
				<Box marginTop={1}>
					<Text dimColor>
						Please check your configuration and try again.
					</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" padding={1}>
			{/* Header */}
			<Logo />
			<InfoSection
				version={presenter.version}
				model={presenter.model}
				directory={presenter.directory}
			/>

			{/* Conversation Area */}
			<ConversationArea
				messages={presenter.messages}
				isLoading={presenter.isLoading}
				streamingMessageId={presenter.streamingMessageId}
			/>

			{/* Tips Section (show when no messages) */}
			{presenter.messages.length === 0 && !presenter.isLoading && (
				<TipsSection />
			)}

			{/* Slash Command Suggestions */}
			{presenter.hasSuggestions() && (
				<SlashSuggestions
					commands={presenter.filteredSuggestions}
					selectedIndex={presenter.selectedSuggestionIndex}
				/>
			)}

			{/* Input Area */}
			<InputBox
				value={presenter.input}
				onChange={presenter.handleInputChange}
				onSubmit={presenter.handleSubmit}
				placeholder="Ask me anything... (type / for commands)"
				enabled={!presenter.isLoading}
			/>

			{/* Input Error */}
			{presenter.inputError && (
				<Box marginLeft={2}>
					<Text color="red">✗ {presenter.inputError}</Text>
				</Box>
			)}

			{/* Footer */}
			<Box marginTop={1}>
				<Text dimColor>Press Ctrl+C to exit | Type /help for commands</Text>
			</Box>
		</Box>
	);
}
