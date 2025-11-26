/**
 * usePermissionDialog Hook
 * Manages permission dialog state and Promise-based async flow
 * 
 * **Feature: permission-mode-fix**
 * **Validates: Requirements 1.1, 1.2, 11.1, 11.2, 11.3, 11.4**
 */

import {useState, useCallback, useRef} from 'react';
import type {
	ToolPermissionContext,
	PermissionResult,
} from '../../core/domain/interfaces/IToolPermissionHandler.js';

export interface ToolPermissionRequest {
	toolName: string;
	toolDescription?: string;
	arguments: Record<string, any>;
	timestamp: Date;
}

export interface PermissionDialogState {
	isOpen: boolean;
	request: ToolPermissionRequest | null;
}

export interface UsePermissionDialogReturn {
	dialogState: PermissionDialogState;
	showDialog: (context: ToolPermissionContext) => Promise<PermissionResult>;
	handleApprove: () => void;
	handleDeny: () => void;
	handleAlwaysAllow: () => void;
}

/**
 * Hook for managing permission dialog state and async flow
 * 
 * Usage:
 * ```tsx
 * const { dialogState, showDialog, handleApprove, handleDeny, handleAlwaysAllow } = usePermissionDialog();
 * 
 * // Register with permission handler
 * permissionHandler.setUICallback({ requestPermission: showDialog });
 * 
 * // Render dialog
 * <ToolPermissionDialog
 *   request={dialogState.request}
 *   onApprove={handleApprove}
 *   onDeny={handleDeny}
 *   onAlwaysAllow={handleAlwaysAllow}
 * />
 * ```
 */
export function usePermissionDialog(): UsePermissionDialogReturn {
	const [dialogState, setDialogState] = useState<PermissionDialogState>({
		isOpen: false,
		request: null,
	});

	// Store resolve function in ref to avoid re-renders
	const resolveRef = useRef<((result: PermissionResult) => void) | null>(null);

	/**
	 * Show permission dialog and return Promise that resolves when user responds
	 * This is the UI callback that gets registered with InteractivePermissionHandler
	 */
	const showDialog = useCallback((context: ToolPermissionContext): Promise<PermissionResult> => {
		return new Promise((resolve) => {
			// Store resolve function
			resolveRef.current = resolve;

			// Convert context to request format
			const request: ToolPermissionRequest = {
				toolName: context.toolCall.name,
				toolDescription: context.toolDescription,
				arguments: context.toolCall.arguments || {},
				timestamp: context.timestamp,
			};

			// Open dialog
			setDialogState({
				isOpen: true,
				request,
			});
		});
	}, []);

	/**
	 * Handle user approval
	 * Resolves Promise with {approved: true}
	 */
	const handleApprove = useCallback(() => {
		if (resolveRef.current) {
			resolveRef.current({
				approved: true,
			});
			resolveRef.current = null;
		}

		setDialogState({
			isOpen: false,
			request: null,
		});
	}, []);

	/**
	 * Handle user denial
	 * Resolves Promise with {approved: false, reason: 'User denied'}
	 */
	const handleDeny = useCallback(() => {
		if (resolveRef.current) {
			resolveRef.current({
				approved: false,
				reason: 'User denied',
			});
			resolveRef.current = null;
		}

		setDialogState({
			isOpen: false,
			request: null,
		});
	}, []);

	/**
	 * Handle "Always Allow" selection
	 * Resolves Promise with {approved: true, rememberChoice: true}
	 */
	const handleAlwaysAllow = useCallback(() => {
		if (resolveRef.current) {
			resolveRef.current({
				approved: true,
				rememberChoice: true,
			});
			resolveRef.current = null;
		}

		setDialogState({
			isOpen: false,
			request: null,
		});
	}, []);

	return {
		dialogState,
		showDialog,
		handleApprove,
		handleDeny,
		handleAlwaysAllow,
	};
}
