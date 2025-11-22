/**
 * Tool Permission Dialog
 * Interactive dialog for approving/denying tool execution requests
 */

import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import Button from '../atoms/Button.js';
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

type ButtonFocus = 'allow' | 'deny' | 'always';

export default function ToolPermissionDialog({
	request,
	onApprove,
	onDeny,
	onAlwaysAllow,
}: ToolPermissionDialogProps) {
	const [focusedButton, setFocusedButton] = useState<ButtonFocus>('allow');

	useEffect(() => {
		if (request) {
			logger.info('ToolPermissionDialog', 'useEffect', 'Permission dialog opened', {
				tool_name: request.toolName,
				has_description: !!request.toolDescription,
				args_count: Object.keys(request.arguments).length,
			});

			setFocusedButton('allow');
		}
	}, [request]);

	useLayerSwitch('dialog', !!request, 'screen');

	useInput(
		(input, key) => {
			if (!request) return;

			if (key.tab || key.rightArrow) {
				logger.debug('ToolPermissionDialog', 'useInput', 'Navigating right');

				setFocusedButton(prev => {
					if (prev === 'allow') return 'deny';
					if (prev === 'deny') return 'always';
					return 'allow';
				});
			} else if (key.leftArrow) {
				logger.debug('ToolPermissionDialog', 'useInput', 'Navigating left');

				setFocusedButton(prev => {
					if (prev === 'always') return 'deny';
					if (prev === 'deny') return 'allow';
					return 'always';
				});
			}

			if (key.return) {
				logger.info('ToolPermissionDialog', 'useInput', 'User confirmed selection', {
					tool_name: request.toolName,
					action: focusedButton,
				});

				if (focusedButton === 'allow') {
					onApprove();
				} else if (focusedButton === 'deny') {
					onDeny();
				} else if (focusedButton === 'always') {
					onAlwaysAllow();
				}
			}

			if (input === 'y') {
				logger.info('ToolPermissionDialog', 'useInput', 'User approved tool (shortcut Y)', {
					tool_name: request.toolName,
				});
				onApprove();
			} else if (input === 'n') {
				logger.info('ToolPermissionDialog', 'useInput', 'User denied tool (shortcut N)', {
					tool_name: request.toolName,
				});
				onDeny();
			} else if (input === 'a') {
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
			<Box marginBottom={1}>
				<Text bold color="yellow">
					🔧 Tool Execution Permission Required
				</Text>
			</Box>

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

			<Box marginBottom={1} paddingY={0}>
				<Text dimColor>
					⚠️  Only allow tools from trusted sources. Review arguments carefully.
				</Text>
			</Box>

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

			<Box marginTop={1}>
				<Text dimColor>
					Navigate: Tab/Arrow Keys • Confirm: Enter • Quick: Y/N/A
				</Text>
			</Box>
		</Box>
	);
}
