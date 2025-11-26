/**
 * Tool Permission Dialog
 * Interactive dialog for approving/denying tool execution requests
 * 
 * Layout: Vertical list with keyboard navigation
 * - Up/Down arrows to move selection
 * - Enter to confirm selection
 * - Y/N/A shortcuts for quick actions
 * - Escape to deny and close
 */

import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import {useLayerSwitch} from '../../../core/input/index.js';
import {getLogger} from '../../../infrastructure/logging/Logger.js';

const logger = getLogger();

export interface ToolPermissionRequest {
	toolName: string;
	toolDescription?: string;
	arguments: Record<string, any>;
	timestamp: Date;
}

export interface ToolPermissionDialogProps {
	request: ToolPermissionRequest | null;
	onApprove: () => void;
	onDeny: () => void;
	onAlwaysAllow: () => void;
}

// Selection indices: 0 = Allow, 1 = Deny, 2 = Always Allow
export type SelectionIndex = 0 | 1 | 2;

const OPTIONS = [
	{label: 'Allow', shortcut: 'Y', color: 'green', icon: '✓'},
	{label: 'Deny', shortcut: 'N', color: 'red', icon: '✗'},
	{label: 'Always Allow', shortcut: 'A', color: 'blue', icon: '★'},
] as const;

export default function ToolPermissionDialog({
	request,
	onApprove,
	onDeny,
	onAlwaysAllow,
}: ToolPermissionDialogProps) {
	const [selectedIndex, setSelectedIndex] = useState<SelectionIndex>(0);

	useEffect(() => {
		if (request) {
			logger.info('ToolPermissionDialog', 'useEffect', 'Permission dialog opened', {
				tool_name: request.toolName,
				has_description: !!request.toolDescription,
				args_count: Object.keys(request.arguments).length,
			});

			// Reset to "Allow" option when dialog opens (Requirement 8.3)
			setSelectedIndex(0);
		}
	}, [request]);

	useLayerSwitch('dialog', !!request, 'screen');

	useInput(
		(input, key) => {
			if (!request) return;

			// Up/Down arrow navigation (Requirement 6.2)
			if (key.upArrow) {
				logger.debug('ToolPermissionDialog', 'useInput', 'Navigating up');
				setSelectedIndex(prev => (prev === 0 ? 2 : (prev - 1)) as SelectionIndex);
			} else if (key.downArrow) {
				logger.debug('ToolPermissionDialog', 'useInput', 'Navigating down');
				setSelectedIndex(prev => (prev === 2 ? 0 : (prev + 1)) as SelectionIndex);
			}

			// Enter to confirm selection (Requirement 6.3)
			if (key.return) {
				logger.info('ToolPermissionDialog', 'useInput', 'User confirmed selection', {
					tool_name: request.toolName,
					action: OPTIONS[selectedIndex].label,
				});

				if (selectedIndex === 0) {
					onApprove();
				} else if (selectedIndex === 1) {
					onDeny();
				} else if (selectedIndex === 2) {
					onAlwaysAllow();
				}
			}

			// Escape to deny and close (Requirement 6.7)
			if (key.escape) {
				logger.info('ToolPermissionDialog', 'useInput', 'User denied tool (Escape)', {
					tool_name: request.toolName,
				});
				onDeny();
			}

			// Shortcut keys (Requirements 6.4, 6.5, 6.6)
			if (input === 'y' || input === 'Y') {
				logger.info('ToolPermissionDialog', 'useInput', 'User approved tool (shortcut Y)', {
					tool_name: request.toolName,
				});
				onApprove();
			} else if (input === 'n' || input === 'N') {
				logger.info('ToolPermissionDialog', 'useInput', 'User denied tool (shortcut N)', {
					tool_name: request.toolName,
				});
				onDeny();
			} else if (input === 'a' || input === 'A') {
				logger.info('ToolPermissionDialog', 'useInput', 'User always allowed tool (shortcut A)', {
					tool_name: request.toolName,
				});
				onAlwaysAllow();
			}
		},
		{isActive: !!request},
	);

	if (!request) {
		return null;
	}

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="yellow"
			padding={1}
			marginY={1}
		>
			{/* Header */}
			<Box marginBottom={1}>
				<Text bold color="yellow">
					🔧 Tool Execution Permission Required
				</Text>
			</Box>

			{/* Tool Info */}
			<Box flexDirection="column" marginBottom={1}>
				{/* Tool name prominently at top (Requirement 7.1) */}
				<Box>
					<Text bold>Tool: </Text>
					<Text color="cyan" bold>{request.toolName}</Text>
				</Box>

				{/* Description in dimmed text (Requirement 7.4) */}
				{request.toolDescription && (
					<Box marginTop={0}>
						<Text dimColor>{request.toolDescription}</Text>
					</Box>
				)}

				{/* Arguments in compact JSON format (Requirement 7.2) */}
				<Box marginTop={1}>
					<Text bold>Arguments:</Text>
				</Box>
				<Box paddingLeft={2}>
					<Text color="green">
						{JSON.stringify(request.arguments, null, 2)}
					</Text>
				</Box>
			</Box>

			{/* Warning */}
			<Box marginBottom={1} paddingY={0}>
				<Text dimColor>
					⚠️  Only allow tools from trusted sources. Review arguments carefully.
				</Text>
			</Box>

			{/* Vertical Options List (Requirement 6.1) */}
			<Box flexDirection="column" marginBottom={1}>
				{OPTIONS.map((option, index) => {
					const isSelected = selectedIndex === index;
					return (
						<Box key={option.label} paddingY={0}>
							{/* Selection indicator */}
							<Text color={isSelected ? option.color : 'gray'}>
								{isSelected ? '▶ ' : '  '}
							</Text>
							{/* Option with highlight/dim styling (Requirements 8.1, 8.2) */}
							<Text
								color={isSelected ? option.color : 'gray'}
								bold={isSelected}
								dimColor={!isSelected}
							>
								{option.icon} {option.label}
							</Text>
							{/* Shortcut hint */}
							<Text dimColor> ({option.shortcut})</Text>
						</Box>
					);
				})}
			</Box>

			{/* Keyboard shortcuts hint (Requirement 7.3) */}
			<Box marginTop={1}>
				<Text dimColor>
					↑/↓: Navigate • Enter: Confirm • Y/N/A: Quick • Esc: Deny
				</Text>
			</Box>
		</Box>
	);
}
