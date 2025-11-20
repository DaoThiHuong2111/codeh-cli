/**
 * Shortcut Manager
 * Centralized keyboard shortcut management with layer-based priority system
 */

import type {
	ShortcutDefinition,
	RegisteredShortcut,
	ShortcutLayer,
	KeyCombo,
	ShortcutConflict,
	ShortcutManagerConfig,
	LayerState,
	InkKey,
} from './types';
import {LAYER_PRIORITY} from './types';
import {parseKeyCombo, matchKeyCombo, normalizeKeyCombo} from './keyParser';

export class ShortcutManager {
	private shortcuts: Map<string, RegisteredShortcut> = new Map();
	private activeLayer: ShortcutLayer = 'screen';
	private config: ShortcutManagerConfig;
	private idCounter = 0;

	constructor(config: ShortcutManagerConfig = {}) {
		this.config = {
			debug: false,
			detectConflicts: true,
			globalAlwaysActive: true,
			...config,
		};
	}

	/**
	 * Register a new shortcut
	 * Returns unique ID for unregistering
	 */
	register(definition: ShortcutDefinition): string {
		const id = definition.id || this.generateId();
		const normalizedKey = normalizeKeyCombo(definition.key);

		const registered: RegisteredShortcut = {
			...definition,
			id,
			key: normalizedKey,
			priority: definition.priority ?? 0,
			registeredAt: new Date(),
		};

		this.shortcuts.set(id, registered);

		if (this.config.debug) {
			console.log(
				`[ShortcutManager] Registered: ${id} - ${normalizedKey} (${definition.layer})`,
			);
		}

		if (this.config.detectConflicts) {
			const conflicts = this.detectConflictsForKey(
				normalizedKey,
				definition.layer,
			);
			if (conflicts.length > 1) {
				console.warn(
					`[ShortcutManager] Conflict detected for key "${normalizedKey}" in layer "${definition.layer}":`,
					conflicts.map(c => c.id),
				);
			}
		}

		return id;
	}

	/**
	 * Unregister a shortcut by ID
	 */
	unregister(id: string): boolean {
		const removed = this.shortcuts.delete(id);

		if (this.config.debug && removed) {
			console.log(`[ShortcutManager] Unregistered: ${id}`);
		}

		return removed;
	}

	/**
	 * Set active layer (blocks lower priority layers)
	 */
	setActiveLayer(layer: ShortcutLayer): void {
		if (this.activeLayer !== layer) {
			if (this.config.debug) {
				console.log(
					`[ShortcutManager] Layer changed: ${this.activeLayer} -> ${layer}`,
				);
			}
			this.activeLayer = layer;
		}
	}

	/**
	 * Get current active layer
	 */
	getActiveLayer(): ShortcutLayer {
		return this.activeLayer;
	}

	/**
	 * Handle input from Ink's useInput
	 * Returns true if handled
	 */
	handleInput(input: string, key: InkKey): boolean {
		const keyCombo = parseKeyCombo(input, key);

		if (!keyCombo) {
			return false;
		}

		if (this.config.debug) {
			console.log(`[ShortcutManager] Input: "${keyCombo}"`);
		}

		const matchingShortcuts = this.getMatchingShortcuts(keyCombo);

		if (matchingShortcuts.length === 0) {
			return false;
		}

		const sorted = matchingShortcuts.sort((a, b) => {
			const layerDiff = LAYER_PRIORITY[b.layer] - LAYER_PRIORITY[a.layer];
			if (layerDiff !== 0) return layerDiff;
			return (b.priority ?? 0) - (a.priority ?? 0);
		});

		let handled = false;
		const activePriority = LAYER_PRIORITY[this.activeLayer];

		for (const shortcut of sorted) {
			const shortcutPriority = LAYER_PRIORITY[shortcut.layer];

			const shouldExecute =
				(this.config.globalAlwaysActive && shortcut.layer === 'global') ||
				shortcutPriority >= activePriority;

			if (!shouldExecute) {
				if (this.config.debug) {
					console.log(
						`[ShortcutManager] Blocked: ${shortcut.id} (layer: ${shortcut.layer}, active: ${this.activeLayer})`,
					);
				}
				continue;
			}

			if (shortcut.enabled && !shortcut.enabled()) {
				if (this.config.debug) {
					console.log(
						`[ShortcutManager] Disabled: ${shortcut.id} (condition: false)`,
					);
				}
				continue;
			}

			if (this.config.debug) {
				console.log(
					`[ShortcutManager] Executing: ${shortcut.id} - ${shortcut.key} (${shortcut.layer})`,
				);
			}

			try {
				const result = shortcut.handler();
				if (result === true) {
					handled = true;
					break;
				}
			} catch (error) {
				console.error(
					`[ShortcutManager] Error executing shortcut ${shortcut.id}:`,
					error,
				);
			}
		}

		return handled;
	}

	/**
	 * Get all shortcuts matching a key combo
	 */
	private getMatchingShortcuts(keyCombo: KeyCombo): RegisteredShortcut[] {
		const matches: RegisteredShortcut[] = [];

		for (const shortcut of this.shortcuts.values()) {
			if (matchKeyCombo(shortcut.key, keyCombo)) {
				matches.push(shortcut);
			}
		}

		return matches;
	}

	/**
	 * Detect conflicts for a specific key in a layer
	 */
	private detectConflictsForKey(
		keyCombo: KeyCombo,
		layer: ShortcutLayer,
	): RegisteredShortcut[] {
		const conflicts: RegisteredShortcut[] = [];

		for (const shortcut of this.shortcuts.values()) {
			if (shortcut.layer === layer && matchKeyCombo(shortcut.key, keyCombo)) {
				conflicts.push(shortcut);
			}
		}

		return conflicts;
	}

	/**
	 * Get all conflicts across all layers
	 */
	getConflicts(): ShortcutConflict[] {
		const conflictMap = new Map<string, ShortcutConflict>();

		for (const shortcut of this.shortcuts.values()) {
			const key = `${shortcut.key}:${shortcut.layer}`;

			if (!conflictMap.has(key)) {
				conflictMap.set(key, {
					key: shortcut.key,
					layer: shortcut.layer,
					shortcuts: [],
				});
			}

			conflictMap.get(key)!.shortcuts.push(shortcut);
		}

		return Array.from(conflictMap.values()).filter(
			conflict => conflict.shortcuts.length > 1,
		);
	}

	/**
	 * Get all active shortcuts (based on current layer)
	 */
	getActiveShortcuts(): RegisteredShortcut[] {
		const activePriority = LAYER_PRIORITY[this.activeLayer];
		const active: RegisteredShortcut[] = [];

		for (const shortcut of this.shortcuts.values()) {
			const shortcutPriority = LAYER_PRIORITY[shortcut.layer];

			if (shortcut.layer === 'global' || shortcutPriority >= activePriority) {
				if (!shortcut.enabled || shortcut.enabled()) {
					active.push(shortcut);
				}
			}
		}

		return active;
	}

	/**
	 * Get all shortcuts for a specific layer
	 */
	getShortcutsByLayer(layer: ShortcutLayer): RegisteredShortcut[] {
		return Array.from(this.shortcuts.values()).filter(s => s.layer === layer);
	}

	/**
	 * Get layer states
	 */
	getLayerStates(): LayerState[] {
		const layers: ShortcutLayer[] = ['global', 'screen', 'dialog', 'input'];

		return layers.map(layer => ({
			layer,
			active: layer === this.activeLayer,
			shortcutCount: this.getShortcutsByLayer(layer).length,
		}));
	}

	/**
	 * Clear all shortcuts
	 */
	clear(): void {
		this.shortcuts.clear();
		if (this.config.debug) {
			console.log('[ShortcutManager] Cleared all shortcuts');
		}
	}

	/**
	 * Get debug state
	 */
	getDebugState(): any {
		return {
			activeLayer: this.activeLayer,
			totalShortcuts: this.shortcuts.size,
			conflicts: this.getConflicts(),
			layerStates: this.getLayerStates(),
			shortcuts: Array.from(this.shortcuts.values()).map(s => ({
				id: s.id,
				key: s.key,
				layer: s.layer,
				priority: s.priority,
				description: s.description,
				source: s.source,
				enabled: s.enabled ? s.enabled() : true,
			})),
		};
	}

	/**
	 * Log current state (for debugging)
	 */
	logState(): void {
		console.log('[ShortcutManager] State:', this.getDebugState());
	}

	/**
	 * Generate unique ID
	 */
	private generateId(): string {
		return `shortcut_${++this.idCounter}_${Date.now()}`;
	}
}
