/**
 * Product Repository - Database operations for products
 */

import {UserService} from './UserService';

export interface Product {
	id: string;
	name: string;
	price: number;
	category: string;
	inStock: boolean;
}

export class ProductRepository {
	private products: Product[] = [];
	private userService: UserService;

	constructor(userService: UserService) {
		this.userService = userService;
	}

	/**
	 * Add a new product
	 */
	addProduct(product: Omit<Product, 'id'>): Product {
		const newProduct: Product = {
			id: this.generateProductId(),
			...product,
		};
		this.products.push(newProduct);
		return newProduct;
	}

	/**
	 * Find product by ID
	 */
	findProductById(id: string): Product | undefined {
		return this.products.find(p => p.id === id);
	}

	/**
	 * Find products by category
	 */
	findByCategory(category: string): Product[] {
		return this.products.filter(p => p.category === category);
	}

	/**
	 * Update product stock status
	 */
	updateStock(id: string, inStock: boolean): Product | undefined {
		const product = this.findProductById(id);
		if (product) {
			product.inStock = inStock;
		}
		return product;
	}

	/**
	 * Get all in-stock products
	 */
	getInStockProducts(): Product[] {
		return this.products.filter(p => p.inStock);
	}

	/**
	 * Calculate total inventory value
	 */
	calculateInventoryValue(): number {
		return this.products.reduce((sum, p) => sum + p.price, 0);
	}

	/**
	 * Generate unique product ID
	 */
	private generateProductId(): string {
		return `prod_${Date.now()}_${this.products.length}`;
	}
}
