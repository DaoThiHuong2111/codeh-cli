import {useState, useEffect} from 'react';
import {Container} from '../../core/di/Container.js';
import {HomePresenter} from '../presenters/HomePresenter.js';
import {useCodehClient} from './useCodehClient.js';
import {CommandService} from '../../core/application/services/CommandService.js';
import {FileSessionManager} from '../../infrastructure/session/SessionManager.js';
import {WorkflowManager} from '../../core/application/services/WorkflowManager.js';
import {InputHistoryService} from '../../core/application/services/InputHistoryService.js';

export interface UseHomeLogicReturn {
	presenter: HomePresenter | null;
	loading: boolean;
	error: string | null;
}

/**
 * Custom hook for Home screen
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

	useEffect(() => {
		const initPresenter = async () => {
			try {
				setLoading(true);

				// Initialize client if needed
				const initializedClient = await initializeClient();
				console.log(
					'[DEBUG useHomeLogic] Initialized client:',
					initializedClient,
				);
				console.log('[DEBUG useHomeLogic] clientError:', clientError);

				if (!initializedClient) {
					const errorMsg = clientError || 'Failed to initialize API client';
					console.error('[ERROR] API client initialization failed:', errorMsg);
					setError(errorMsg);
					return;
				}

				// Load config
				const {ConfigLoader} = await import(
					'../../infrastructure/config/ConfigLoader.js'
				);
				const loader = new ConfigLoader();
				const config = await loader.load();

				if (!config) {
					setError('Failed to load configuration');
					return;
				}

				// Create dependencies
				const commandRegistry = new CommandService();
				const sessionManager = new FileSessionManager();
				const inputHistory = new InputHistoryService(50); // Keep last 50 inputs

				await sessionManager.init();

				// Resolve WorkflowManager from container
				const workflowManager =
					container.resolve<WorkflowManager>('WorkflowManager');

				// Resolve SandboxModeManager from container
				const {SandboxModeManager} = await import(
					'../../infrastructure/process/SandboxModeManager.js'
				);
				const sandboxModeManager = container.resolve<InstanceType<typeof SandboxModeManager>>(
					'SandboxModeManager',
				);

				// Create presenter
				const newPresenter = new HomePresenter(
					initializedClient,
					commandRegistry,
					sessionManager,
					config,
					inputHistory,
					workflowManager,
					sandboxModeManager,
				);

				// Setup view callback for reactive updates
				newPresenter.setViewUpdateCallback(() => {
					forceUpdate({});
				});

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

	// Cleanup on unmount (auto-save session before exit)
	useEffect(() => {
		return () => {
			if (presenter) {
				// Call cleanup asynchronously (auto-save session)
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
	};
}
