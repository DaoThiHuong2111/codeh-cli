/**
 * Result Cache for Code Navigation
 * Caches results of expensive operations (symbol searches, references, etc.)
 */

import {LRUCache} from './LRUCache.js';
import {Symbol} from '../../core/domain/models/Symbol.js';
import {Reference} from '../../core/domain/models/Reference.js';

export interface CacheStats {
	hits: number;
	misses: number;
	evictions: number;
	size: number;
	hitRate: number;
}

/**
 * Result Cache with automatic invalidation
 */
export class ResultCache {
	private symbolSearchCache: LRUCache<string, Symbol[]>;
	private referencesCache: LRUCache<string, Reference[]>;
	private hierarchyCache: LRUCache<string, Symbol[]>;
	private fileMetadataCache: LRUCache<string, FileMetadata>;

	private stats = {
		symbolSearchHits: 0,
		symbolSearchMisses: 0,
		referencesHits: 0,
		referencesMisses: 0,
		hierarchyHits: 0,
		hierarchyMisses: 0,
		evictions: 0,
	};

	constructor(maxSize: number = 500) {
		const onEvict = () => {
			this.stats.evictions++;
		};

		this.symbolSearchCache = new LRUCache({
			maxSize: Math.floor(maxSize * 0.4), // 40% for symbol searches
			onEvict,
		});

		this.referencesCache = new LRUCache({
			maxSize: Math.floor(maxSize * 0.3), // 30% for references
			onEvict,
		});

		this.hierarchyCache = new LRUCache({
			maxSize: Math.floor(maxSize * 0.2), // 20% for hierarchies
			onEvict,
		});

		this.fileMetadataCache = new LRUCache({
			maxSize: Math.floor(maxSize * 0.1), // 10% for metadata
			onEvict,
		});
	}

	// ============================================
	// Symbol Search Cache
	// ============================================

	/**
	 * Get cached symbol search results
	 */
	getSymbolSearch(
		namePath: string,
		filePath: string,
		options?: any,
	): Symbol[] | undefined {
		const key = this.makeSymbolSearchKey(namePath, filePath, options);
		const result = this.symbolSearchCache.get(key);

		if (result) {
			this.stats.symbolSearchHits++;
			return result;
		}

		this.stats.symbolSearchMisses++;
		return undefined;
	}

	/**
	 * Cache symbol search results
	 */
	setSymbolSearch(
		namePath: string,
		filePath: string,
		options: any,
		symbols: Symbol[],
	): void {
		const key = this.makeSymbolSearchKey(namePath, filePath, options);
		this.symbolSearchCache.set(key, symbols);
	}

	private makeSymbolSearchKey(
		namePath: string,
		filePath: string,
		options?: any,
	): string {
		const opts = options || {};
		return `search:${namePath}:${filePath}:${opts.includeBody}:${opts.depth}:${opts.substringMatching}`;
	}

	// ============================================
	// References Cache
	// ============================================

	/**
	 * Get cached references
	 */
	getReferences(symbolName: string, filePath: string): Reference[] | undefined {
		const key = this.makeReferencesKey(symbolName, filePath);
		const result = this.referencesCache.get(key);

		if (result) {
			this.stats.referencesHits++;
			return result;
		}

		this.stats.referencesMisses++;
		return undefined;
	}

	/**
	 * Cache references
	 */
	setReferences(
		symbolName: string,
		filePath: string,
		references: Reference[],
	): void {
		const key = this.makeReferencesKey(symbolName, filePath);
		this.referencesCache.set(key, references);
	}

	private makeReferencesKey(symbolName: string, filePath: string): string {
		return `refs:${symbolName}:${filePath}`;
	}

	// ============================================
	// Hierarchy Cache
	// ============================================

	/**
	 * Get cached hierarchy
	 */
	getHierarchy(filePath: string): Symbol[] | undefined {
		const key = `hierarchy:${filePath}`;
		const result = this.hierarchyCache.get(key);

		if (result) {
			this.stats.hierarchyHits++;
			return result;
		}

		this.stats.hierarchyMisses++;
		return undefined;
	}

	/**
	 * Cache hierarchy
	 */
	setHierarchy(filePath: string, hierarchy: Symbol[]): void {
		const key = `hierarchy:${filePath}`;
		this.hierarchyCache.set(key, hierarchy);
	}

	// ============================================
	// File Metadata Cache
	// ============================================

	/**
	 * Get cached file metadata
	 */
	getFileMetadata(filePath: string): FileMetadata | undefined {
		return this.fileMetadataCache.get(`meta:${filePath}`);
	}

	/**
	 * Cache file metadata
	 */
	setFileMetadata(filePath: string, metadata: FileMetadata): void {
		this.fileMetadataCache.set(`meta:${filePath}`, metadata);
	}

	// ============================================
	// Cache Invalidation
	// ============================================

	/**
	 * Invalidate all caches for a specific file
	 * Called when file is modified
	 */
	invalidateFile(filePath: string): void {
		// Invalidate symbol searches for this file
		for (const key of this.symbolSearchCache.keys()) {
			if (key.includes(filePath)) {
				this.symbolSearchCache.delete(key);
			}
		}

		// Invalidate references for this file
		for (const key of this.referencesCache.keys()) {
			if (key.includes(filePath)) {
				this.referencesCache.delete(key);
			}
		}

		// Invalidate hierarchy for this file
		this.hierarchyCache.delete(`hierarchy:${filePath}`);

		// Invalidate metadata for this file
		this.fileMetadataCache.delete(`meta:${filePath}`);
	}

	/**
	 * Clear all caches
	 */
	clearAll(): void {
		this.symbolSearchCache.clear();
		this.referencesCache.clear();
		this.hierarchyCache.clear();
		this.fileMetadataCache.clear();
	}

	// ============================================
	// Statistics
	// ============================================

	/**
	 * Get cache statistics
	 */
	getStats(): CacheStats {
		const totalHits =
			this.stats.symbolSearchHits +
			this.stats.referencesHits +
			this.stats.hierarchyHits;
		const totalMisses =
			this.stats.symbolSearchMisses +
			this.stats.referencesMisses +
			this.stats.hierarchyMisses;
		const total = totalHits + totalMisses;

		return {
			hits: totalHits,
			misses: totalMisses,
			evictions: this.stats.evictions,
			size:
				this.symbolSearchCache.size +
				this.referencesCache.size +
				this.hierarchyCache.size +
				this.fileMetadataCache.size,
			hitRate: total > 0 ? totalHits / total : 0,
		};
	}

	/**
	 * Reset statistics
	 */
	resetStats(): void {
		this.stats = {
			symbolSearchHits: 0,
			symbolSearchMisses: 0,
			referencesHits: 0,
			referencesMisses: 0,
			hierarchyHits: 0,
			hierarchyMisses: 0,
			evictions: 0,
		};
	}
}

/**
 * File metadata for quick lookups
 */
export interface FileMetadata {
	filePath: string;
	symbolCount: number;
	hasExports: boolean;
	lastModified: number;
	topLevelSymbols: string[]; // Symbol names
}
