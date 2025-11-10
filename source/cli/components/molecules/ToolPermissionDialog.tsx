/**
 * Tool Permission Dialog
 * Interactive dialog for approving/denying tool execution requests
 */

import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import Button from '../atoms/Button.js';
import {useLayerSwitch} from '../../../core/input/index.js';

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

type ButtonFocus = 'allow' | 'deny' | 'always';

export default function ToolPermissionDialog({
	request,
	onApprove,
	onDeny,
	onAlwaysAllow,
}: ToolPermissionDialogProps) {
	const [focusedButton, setFocusedButton] = useState<ButtonFocus>('allow');

	// Reset focus when request changes
	useEffect(() => {
		if (request) {
			setFocusedButton('allow');
		}
	}, [request]);

	// Switch to dialog layer when dialog is visible
	// This blocks screen-level shortcuts when dialog is active
	useLayerSwitch('dialog', !!request, 'screen');

	useInput(
		(input, key) => {
			if (!request) return;

			// Tab or arrow keys to navigate
			if (key.tab || key.rightArrow) {
				setFocusedButton(prev => {
					if (prev === 'allow') return 'deny';
					if (prev === 'deny') return 'always';
					return 'allow';
				});
			} else if (key.leftArrow) {
				setFocusedButton(prev => {
					if (prev === 'always') return 'deny';
					if (prev === 'deny') return 'allow';
					return 'always';
				});
			}

			// Enter to confirm
			if (key.return) {
				if (focusedButton === 'allow') {
					onApprove();
				} else if (focusedButton === 'deny') {
					onDeny();
				} else if (focusedButton === 'always') {
					onAlwaysAllow();
				}
			}

			// Shortcuts
			if (input === 'y') {
				onApprove();
			} else if (input === 'n') {
				onDeny();
			} else if (input === 'a') {
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
				<Box>
					<Text bold>Tool: </Text>
					<Text color="cyan">{request.toolName}</Text>
				</Box>

				{request.toolDescription && (
					<Box marginTop={0}>
						<Text dimColor>Description: {request.toolDescription}</Text>
					</Box>
				)}

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

			{/* Buttons */}
			<Box gap={2}>
				<Button
					label="✓ Allow (Y)"
					color="green"
					bgColor="bgGreen"
					focused={focusedButton === 'allow'}
					paddingX={1}
					paddingY={0}
				/>
				<Button
					label="✗ Deny (N)"
					color="red"
					bgColor="bgRed"
					focused={focusedButton === 'deny'}
					paddingX={1}
					paddingY={0}
				/>
				<Button
					label="✓ Always Allow (A)"
					color="blue"
					bgColor="bgBlue"
					focused={focusedButton === 'always'}
					paddingX={1}
					paddingY={0}
				/>
			</Box>

			{/* Keyboard hint */}
			<Box marginTop={1}>
				<Text dimColor>
					Navigate: Tab/Arrow Keys • Confirm: Enter • Quick: Y/N/A
				</Text>
			</Box>
		</Box>
	);
}
