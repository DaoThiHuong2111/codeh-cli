import { useState, useEffect } from 'react';
import { Container } from '../../core/di/Container.js';
import { HomePresenterNew } from '../presenters/HomePresenterNew.js';
import { useCodehClient } from './useCodehClient.js';
import { CommandService } from '../../core/application/services/CommandService.js';
import { FileSessionManager } from '../../infrastructure/session/SessionManager.js';

export interface UseHomeLogicNewReturn {
	presenter: HomePresenterNew | null;
	loading: boolean;
	error: string | null;
}

/**
 * Custom hook for Home screen với HomePresenterNew
 */
export function useHomeLogicNew(container: Container): UseHomeLogicNewReturn {
	const { client, loading: clientLoading, error: clientError, initializeClient } = useCodehClient(container);
	const [presenter, setPresenter] = useState<HomePresenterNew | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [, forceUpdate] = useState({});

	useEffect(() => {
		const initPresenter = async () => {
			try {
				setLoading(true);

				// Initialize client if needed
				const success = await initializeClient();
				if (!success || !client) {
					setError('Failed to initialize API client');
					return;
				}

				// Load config
				const { ConfigLoader } = await import('../../infrastructure/config/ConfigLoader.js');
				const loader = new ConfigLoader();
				const config = await loader.load();

				if (!config) {
					setError('Failed to load configuration');
					return;
				}

				// Create dependencies
				const commandRegistry = new CommandService();
				const sessionManager = new FileSessionManager();

				await sessionManager.init();

				// Create presenter
				const newPresenter = new HomePresenterNew(
					client,
					commandRegistry,
					sessionManager,
					config,
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

	return {
		presenter,
		loading,
		error,
	};
}
