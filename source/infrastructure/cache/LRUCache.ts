/**
 * LRU Cache Implementation
 * Least Recently Used cache with configurable size limit
 */

interface CacheNode<K, V> {
	key: K;
	value: V;
	prev: CacheNode<K, V> | null;
	next: CacheNode<K, V> | null;
}

export interface LRUCacheOptions {
	maxSize: number;
	onEvict?: (key: string, value: any) => void;
}

/**
 * LRU Cache with O(1) get/set operations
 * Uses doubly-linked list + hash map for efficient operations
 */
export class LRUCache<K extends string, V> {
	private maxSize: number;
	private cache: Map<K, CacheNode<K, V>>;
	private head: CacheNode<K, V> | null = null;
	private tail: CacheNode<K, V> | null = null;
	private onEvict?: (key: string, value: any) => void;

	constructor(options: LRUCacheOptions) {
		this.maxSize = options.maxSize;
		this.cache = new Map();
		this.onEvict = options.onEvict;
	}

	/**
	 * Get value from cache
	 * Moves accessed item to front (most recently used)
	 */
	get(key: K): V | undefined {
		const node = this.cache.get(key);
		if (!node) {
			return undefined;
		}

		this.moveToFront(node);
		return node.value;
	}

	/**
	 * Set value in cache
	 * Adds new item or updates existing, moves to front
	 * Evicts least recently used if at capacity
	 */
	set(key: K, value: V): void {
		const existingNode = this.cache.get(key);

		if (existingNode) {
			existingNode.value = value;
			this.moveToFront(existingNode);
			return;
		}

		const newNode: CacheNode<K, V> = {
			key,
			value,
			prev: null,
			next: null,
		};

		if (!this.head) {
			this.head = newNode;
			this.tail = newNode;
		} else {
			newNode.next = this.head;
			this.head.prev = newNode;
			this.head = newNode;
		}

		this.cache.set(key, newNode);

		if (this.cache.size > this.maxSize) {
			this.evictLRU();
		}
	}

	/**
	 * Check if key exists in cache
	 */
	has(key: K): boolean {
		return this.cache.has(key);
	}

	/**
	 * Delete key from cache
	 */
	delete(key: K): boolean {
		const node = this.cache.get(key);
		if (!node) {
			return false;
		}

		this.removeNode(node);
		this.cache.delete(key);
		return true;
	}

	/**
	 * Clear all cache entries
	 */
	clear(): void {
		this.cache.clear();
		this.head = null;
		this.tail = null;
	}

	/**
	 * Get current cache size
	 */
	get size(): number {
		return this.cache.size;
	}

	/**
	 * Get all keys in cache (most recent first)
	 */
	keys(): K[] {
		const keys: K[] = [];
		let current = this.head;
		while (current) {
			keys.push(current.key);
			current = current.next;
		}
		return keys;
	}

	/**
	 * Move node to front of list (most recently used)
	 */
	private moveToFront(node: CacheNode<K, V>): void {
		if (node === this.head) {
			return;
		}

		this.removeNode(node);

		node.prev = null;
		node.next = this.head;
		if (this.head) {
			this.head.prev = node;
		}
		this.head = node;

		if (!this.tail) {
			this.tail = node;
		}
	}

	/**
	 * Remove node from list (without deleting from map)
	 */
	private removeNode(node: CacheNode<K, V>): void {
		if (node.prev) {
			node.prev.next = node.next;
		} else {
			this.head = node.next;
		}

		if (node.next) {
			node.next.prev = node.prev;
		} else {
			this.tail = node.prev;
		}
	}

	/**
	 * Evict least recently used item
	 */
	private evictLRU(): void {
		if (!this.tail) {
			return;
		}

		const evictedKey = this.tail.key;
		const evictedValue = this.tail.value;

		this.removeNode(this.tail);
		this.cache.delete(evictedKey);

		if (this.onEvict) {
			this.onEvict(evictedKey, evictedValue);
		}
	}
}
