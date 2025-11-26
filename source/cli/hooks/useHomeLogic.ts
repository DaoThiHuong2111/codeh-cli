import {useState, useEffect, useCallback, useRef} from 'react';
import {Container} from '../../core/di/Container.js';
import {HomePresenter} from '../presenters/HomePresenter.js';
import {useCodehClient} from './useCodehClient.js';
import {CommandService} from '../../core/application/services/CommandService.js';
import {FileSessionManager} from '../../infrastructure/session/SessionManager.js';
import {WorkflowManager} from '../../core/application/services/WorkflowManager.js';
import {InputHistoryService} from '../../core/application/services/InputHistoryService.js';
import {HybridPermissionHandler} from '../../infrastructure/permissions/HybridPermissionHandler.js';
import type {ToolPermissionContext, PermissionResult} from '../../core/domain/interfaces/IToolPermissionHandler.js';

export interface PermissionDialogState {
	isOpen: boolean;
	request: {
		toolName: string;
		toolDescription?: string;
		arguments: Record<string, any>;
		timestamp: Date;
	} | null;
}

export interface UseHomeLogicReturn {
	presenter: HomePresenter | null;
	loading: boolean;
	error: string | null;
	// Permission dialog state and handlers
	permissionDialog: PermissionDialogState;
	handlePermissionApprove: () => void;
	handlePermissionDeny: () => void;
	handlePermissionAlwaysAllow: () => void;
}

/**
 * Custom hook for Home screen
 * **Feature: permission-mode-fix**
 * **Validates: Requirements 4.1, 4.3**
 */
export function useHomeLogic(container: Container): UseHomeLogicReturn {
	const {
		client,
		loading: clientLoading,
		error: clientError,
		initializeClient,
	} = useCodehClient(container);
	const [presenter, setPresenter] = useState<HomePresenter | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [, forceUpdate] = useState({});

	// Permission dialog state
	const [permissionDialog, setPermissionDialog] = useState<PermissionDialogState>({
		isOpen: false,
		request: null,
	});

	// Store resolve function for Promise-based async flow
	const permissionResolveRef = useRef<((result: PermissionResult) => void) | null>(null);

	// Permission dialog handlers
	const handlePermissionApprove = useCallback(() => {
		if (permissionResolveRef.current) {
			permissionResolveRef.current({ approved: true });
			permissionResolveRef.current = null;
		}
		setPermissionDialog({ isOpen: false, request: null });
	}, []);

	const handlePermissionDeny = useCallback(() => {
		if (permissionResolveRef.current) {
			permissionResolveRef.current({ approved: false, reason: 'User denied' });
			permissionResolveRef.current = null;
		}
		setPermissionDialog({ isOpen: false, request: null });
	}, []);

	const handlePermissionAlwaysAllow = useCallback(() => {
		if (permissionResolveRef.current) {
			permissionResolveRef.current({ approved: true, rememberChoice: true });
			permissionResolveRef.current = null;
		}
		setPermissionDialog({ isOpen: false, request: null });
	}, []);

	// UI callback for permission handler
	const showPermissionDialog = useCallback((context: ToolPermissionContext): Promise<PermissionResult> => {
		return new Promise((resolve) => {
			permissionResolveRef.current = resolve;
			setPermissionDialog({
				isOpen: true,
				request: {
					toolName: context.toolCall.name,
					toolDescription: context.toolDescription,
					arguments: context.toolCall.arguments || {},
					timestamp: context.timestamp,
				},
			});
		});
	}, []);

	useEffect(() => {
		const initPresenter = async () => {
			try {
				setLoading(true);

				const initializedClient = await initializeClient();

				if (!initializedClient) {
					const errorMsg = clientError || 'Failed to initialize API client';
					setError(errorMsg);
					return;
				}

				const {ConfigLoader} = await import(
					'../../infrastructure/config/ConfigLoader.js'
				);
				const loader = new ConfigLoader();
				const config = await loader.load();

				if (!config) {
					setError('Failed to load configuration');
					return;
				}

				const commandRegistry = new CommandService();
				const sessionManager = new FileSessionManager();
				const inputHistory = new InputHistoryService(50);

				await sessionManager.init();

				const workflowManager =
					container.resolve<WorkflowManager>('WorkflowManager');

				const {SandboxModeManager} = await import(
					'../../infrastructure/process/SandboxModeManager.js'
				);
				const sandboxModeManager = container.resolve<InstanceType<typeof SandboxModeManager>>(
					'SandboxModeManager',
				);

				const newPresenter = new HomePresenter(
					initializedClient,
					commandRegistry,
					sessionManager,
					config,
					inputHistory,
					workflowManager,
					sandboxModeManager,
				);

				newPresenter.setViewUpdateCallback(() => {
					forceUpdate({});
				});

				// Register UI callback for permission handler
				// **Feature: permission-mode-fix**
				// **Validates: Requirements 4.1, 4.3**
				try {
					const permissionHandler = container.resolve<HybridPermissionHandler>('PermissionHandler');
					const interactiveHandler = permissionHandler.getInteractiveHandler();
					interactiveHandler.setUICallback({
						requestPermission: showPermissionDialog,
					});
				} catch (err) {
					console.warn('Failed to register permission UI callback:', err);
				}

				setPresenter(newPresenter);
				setError(null);
			} catch (err: any) {
				setError(err.message || 'Failed to initialize presenter');
			} finally {
				setLoading(false);
			}
		};

		initPresenter();
	}, [container]);

	useEffect(() => {
		return () => {
			if (presenter) {
				presenter.cleanup().catch(err => {
					console.error('Error during cleanup:', err);
				});
			}
		};
	}, [presenter]);

	return {
		presenter,
		loading,
		error,
		permissionDialog,
		handlePermissionApprove,
		handlePermissionDeny,
		handlePermissionAlwaysAllow,
	};
}
