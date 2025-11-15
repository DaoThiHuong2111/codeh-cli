/**
 * Welcome Presenter
 * Handles business logic for Welcome screen with API integration
 */

import {UpgradeInfo} from '../../core/domain/models/UpgradeInfo';
import {UpgradeApiService} from '../../infrastructure/api/UpgradeApiService';
import {getLogger} from '../../infrastructure/logging/Logger.js';

const logger = getLogger();

export class WelcomePresenter {
	private apiService: UpgradeApiService;

	constructor() {
		logger.info('WelcomePresenter', 'constructor', 'Initializing Welcome presenter');
		this.apiService = new UpgradeApiService();
		logger.debug('WelcomePresenter', 'constructor', 'Welcome presenter initialized');
	}

	/**
	 * Fetch upgrade information from API
	 */
	async fetchUpgradeInfo(): Promise<UpgradeInfo | null> {
		const start = Date.now();
		logger.info('WelcomePresenter', 'fetchUpgradeInfo', 'Fetching upgrade info');

		try {
			const upgradeInfo = await this.apiService.fetchUpgradeInfo();

			const duration = Date.now() - start;
			logger.info('WelcomePresenter', 'fetchUpgradeInfo', 'Upgrade info fetched', {
				duration_ms: duration,
				has_upgrade_info: !!upgradeInfo,
				version: upgradeInfo?.version,
				has_message: !!upgradeInfo?.message,
			});

			return upgradeInfo;
		} catch (error) {
			const duration = Date.now() - start;
			logger.error('WelcomePresenter', 'fetchUpgradeInfo', 'Failed to fetch upgrade info', {
				duration_ms: duration,
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Check if upgrade info has valid content
	 */
	hasValidUpgradeInfo(upgradeInfo: UpgradeInfo | null): boolean {
		logger.debug('WelcomePresenter', 'hasValidUpgradeInfo', 'Checking upgrade info validity', {
			has_upgrade_info: !!upgradeInfo,
		});

		if (!upgradeInfo) {
			logger.debug('WelcomePresenter', 'hasValidUpgradeInfo', 'No upgrade info provided', {
				is_valid: false,
			});
			return false;
		}

		const isValid = upgradeInfo.hasValidContent();
		logger.debug('WelcomePresenter', 'hasValidUpgradeInfo', 'Upgrade info validity checked', {
			is_valid: isValid,
		});

		return isValid;
	}

	/**
	 * Get display message from upgrade info
	 */
	getDisplayMessage(upgradeInfo: UpgradeInfo | null): string {
		logger.debug('WelcomePresenter', 'getDisplayMessage', 'Getting display message', {
			has_upgrade_info: !!upgradeInfo,
		});

		let message: string;
		if (!upgradeInfo) {
			message = 'Welcome to CODEH CLI - Your AI coding assistant';
			logger.debug('WelcomePresenter', 'getDisplayMessage', 'Using default message', {
				message_length: message.length,
			});
		} else {
			message = upgradeInfo.message || 'Welcome to CODEH CLI - Your AI coding assistant';
			logger.debug('WelcomePresenter', 'getDisplayMessage', 'Using upgrade info message', {
				message_length: message.length,
				has_custom_message: !!upgradeInfo.message,
			});
		}

		return message;
	}

	/**
	 * Get display version from upgrade info
	 */
	getDisplayVersion(upgradeInfo: UpgradeInfo | null): string {
		logger.debug('WelcomePresenter', 'getDisplayVersion', 'Getting display version', {
			has_upgrade_info: !!upgradeInfo,
		});

		let version: string;
		if (!upgradeInfo) {
			version = '';
			logger.debug('WelcomePresenter', 'getDisplayVersion', 'No upgrade info, returning empty version');
		} else {
			version = upgradeInfo.version || '';
			logger.debug('WelcomePresenter', 'getDisplayVersion', 'Returning version', {
				version: version,
				has_version: !!version,
			});
		}

		return version;
	}
}
