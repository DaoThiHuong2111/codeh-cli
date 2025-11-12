import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import {Container} from '../../core/di/Container.js';
import {useHomeLogic} from '../hooks/useHomeLogic.js';
import InputBox from '../components/molecules/InputBox.js';
import InfoSection from '../components/molecules/InfoSection.js';
import Logo from '../components/atoms/Logo.js';
import {ConversationArea} from '../components/organisms/ConversationArea.js';
import {SlashSuggestions} from '../components/organisms/SlashSuggestions.js';
import {Footer} from '../components/organisms/Footer.js';
import {TodosDisplay} from '../components/organisms/TodosDisplay.js';
import {SymbolExplorer} from '../components/organisms/SymbolExplorer.js';
import {useShortcut} from '../../core/input/index.js';
import type {PermissionModeManager} from '../../infrastructure/permissions/PermissionModeManager.js';
import type {PermissionMode} from '../../infrastructure/permissions/PermissionModeManager.js';

interface HomeProps {
	container: Container;
	exitConfirmation?: boolean;
}

export default function Home({container, exitConfirmation = false}: HomeProps) {
	const {presenter, loading, error} = useHomeLogic(container);

	// Permission mode state
	const [permissionMode, setPermissionMode] = useState<PermissionMode>('mvp');
	const [modeManager, setModeManager] = useState<PermissionModeManager | null>(
		null,
	);

	// Symbol Explorer state
	const [showSymbolExplorer, setShowSymbolExplorer] = useState(false);
	const [currentFilePath, setCurrentFilePath] = useState<string>(
		'source/cli/presenters/HomePresenter.ts',
	);

	// Initialize mode manager from container
	useEffect(() => {
		try {
			const manager = container.resolve<PermissionModeManager>(
				'PermissionModeManager',
			);
			setModeManager(manager);
			setPermissionMode(manager.getCurrentMode());

			// Listen for mode changes
			const listener = {
				onModeChanged: (mode: PermissionMode) => {
					setPermissionMode(mode);
				},
			};
			manager.addListener(listener);

			return () => {
				manager.removeListener(listener);
			};
		} catch (err) {
			console.error('Failed to resolve PermissionModeManager:', err);
		}
	}, [container]);

	// Auto-fetch symbols when Symbol Explorer is opened
	useEffect(() => {
		if (showSymbolExplorer && presenter && currentFilePath) {
			presenter.fetchSymbols(currentFilePath).catch(error => {
				console.error('Failed to fetch symbols:', error);
			});
		}
	}, [showSymbolExplorer, presenter, currentFilePath]);

	// Register input-level keyboard shortcuts
	// These shortcuts need to work even when the input box is focused
	// Shift+Tab: Toggle permission mode
	useShortcut({
		key: 'shift+tab',
		handler: () => {
			if (modeManager) {
				modeManager.toggleMode();
			}
		},
		layer: 'input',
		description: 'Toggle permission mode (MVP/Interactive)',
		source: 'Home',
	});

	// Esc: Close help or clear input
	useShortcut({
		key: 'escape',
		handler: () => {
			if (!presenter) return;

			if (presenter.input) {
				presenter.handleInputChange('');
			}
		},
		layer: 'input',
		enabled: () => presenter !== null,
		description: 'Close help or clear input',
		source: 'Home',
	});

	// Up Arrow: Navigate suggestions or history
	useShortcut({
		key: 'up',
		handler: () => {
			if (!presenter) return;

			if (presenter.hasSuggestions()) {
				presenter.handleSuggestionNavigate('up');
			} else if (!presenter.isLoading) {
				presenter.navigateHistory('up');
			}
		},
		layer: 'input',
		enabled: () => presenter !== null,
		description: 'Navigate suggestions/history up',
		source: 'Home',
	});

	// Down Arrow: Navigate suggestions or history
	useShortcut({
		key: 'down',
		handler: () => {
			if (!presenter) return;

			if (presenter.hasSuggestions()) {
				presenter.handleSuggestionNavigate('down');
			} else if (!presenter.isLoading) {
				presenter.navigateHistory('down');
			}
		},
		layer: 'input',
		enabled: () => presenter !== null,
		description: 'Navigate suggestions/history down',
		source: 'Home',
	});

	// Tab: Select suggestion
	useShortcut({
		key: 'tab',
		handler: () => {
			if (presenter && presenter.hasSuggestions()) {
				presenter.handleSuggestionSelect();
			}
		},
		layer: 'input',
		enabled: () => presenter !== null && presenter.hasSuggestions(),
		description: 'Select suggestion',
		source: 'Home',
	});

	// Enter: Select suggestion (when suggestions visible)
	useShortcut({
		key: 'enter',
		handler: () => {
			if (presenter && presenter.hasSuggestions()) {
				presenter.handleSuggestionSelect();
			}
		},
		layer: 'input',
		enabled: () => presenter !== null && presenter.hasSuggestions(),
		description: 'Select suggestion',
		source: 'Home',
	});

	// Ctrl+E: Toggle Symbol Explorer
	useShortcut({
		key: 'ctrl+e',
		handler: () => {
			setShowSymbolExplorer(prev => !prev);
		},
		layer: 'input',
		description: 'Toggle Symbol Explorer',
		source: 'Home',
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
					<Text dimColor>Please check your configuration and try again.</Text>
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

			{/* Todos Display (show when there are todos) */}
			{presenter.todos.length > 0 && <TodosDisplay todos={presenter.todos} />}

			{/* Symbol Explorer (show when toggled with Ctrl+E) */}
			{showSymbolExplorer && (
				<SymbolExplorer
					symbols={presenter.symbols}
					title="🔍 Symbol Explorer"
					filePath={currentFilePath}
					showLocation={true}
				/>
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

			{/* Footer with Stats */}
			<Footer
				model={presenter.model}
				messageCount={presenter.messageCount}
				totalTokens={presenter.totalTokens}
				estimatedCost={presenter.estimatedCost}
				sessionDuration={presenter.sessionDuration}
				gitBranch={presenter.gitBranch}
				permissionMode={permissionMode}
			/>

			{/* Help Hint */}
			<Box marginTop={1}>
				{exitConfirmation ? (
					<Text>Press Ctrl+C again to exit</Text>
				) : (
					<Text dimColor>
						Press <Text color="green">Ctrl+C</Text> to exit | <Text color="cyan">Ctrl+E</Text> Symbol Explorer
					</Text>
				)}
			</Box>
		</Box>
	);
}
