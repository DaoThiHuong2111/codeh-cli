/**
 * Welcome Presenter
 * Handles business logic for Welcome screen with API integration
 */

import {UpgradeInfo} from '../../core/domain/models/UpgradeInfo';
import {UpgradeApiService} from '../../infrastructure/api/UpgradeApiService';

export class WelcomePresenter {
	private apiService: UpgradeApiService;

	constructor() {
		this.apiService = new UpgradeApiService();
	}

	/**
	 * Fetch upgrade information from API
	 */
	async fetchUpgradeInfo(): Promise<UpgradeInfo | null> {
		return await this.apiService.fetchUpgradeInfo();
	}

	/**
	 * Check if upgrade info has valid content
	 */
	hasValidUpgradeInfo(upgradeInfo: UpgradeInfo | null): boolean {
		if (!upgradeInfo) return false;
		return upgradeInfo.hasValidContent();
	}

	/**
	 * Get display message from upgrade info
	 */
	getDisplayMessage(upgradeInfo: UpgradeInfo | null): string {
		if (!upgradeInfo) {
			return 'Welcome to CODEH CLI - Your AI coding assistant';
		}
		return (
			upgradeInfo.message || 'Welcome to CODEH CLI - Your AI coding assistant'
		);
	}

	/**
	 * Get display version from upgrade info
	 */
	getDisplayVersion(upgradeInfo: UpgradeInfo | null): string {
		if (!upgradeInfo) {
			return '';
		}
		return upgradeInfo.version || '';
	}
}
