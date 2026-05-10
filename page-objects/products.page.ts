import { Page } from "@playwright/test";
import { BaseSpreePage } from "./base-spree.page";
import { ProductBlock } from "../component-objects/product-block.component";
import { FlowError } from "../errors/flow.error";
import { ProductDetailsPage } from "./product-details.page";

export class ProductsPage extends BaseSpreePage {
    readonly url: string = `${this.baseUrl}/products`;

    products: ProductBlock[] = [];

    constructor(page: Page) {
        super(page);
    }

    async getProducts(): Promise<ProductBlock[]> {
        if (this.products.length > 0) {
            return this.products;
        }

        const productBlocks = await this.page.locator('a[class="group block"]').all();

        for (const productBlock of productBlocks) {
            const name = await productBlock.locator('h3').textContent();
            const price = await productBlock.locator('span').first().textContent();
            this.products.push(new ProductBlock(this.page, name!, price!));
        }

        return this.products;
    }

    async loadAllProducts(): Promise<ProductsPage> {
        const loopSentinel = 20;

        let allProductsLoaded: boolean = false;
        let loopCounter = 0;

        while (!allProductsLoaded && loopCounter <= loopSentinel) {
            try {
                await this.footer.footer.scrollIntoViewIfNeeded();

                await this.page.locator('p:has-text("No more products to load")').waitFor({ state: 'visible', timeout: 1000 });
                allProductsLoaded = true;
            } catch (error) {
                console.debug(`All products have not yet been loaded. ${error}`);
                loopCounter++;
            }

            loopCounter++;
        }

        this.products = await this.getProducts();

        return this;
    }

    async openProductByName(productName: string): Promise<ProductDetailsPage> {
        const product = (await this.getProducts()).find(product => product.name === productName);
        if (!product) {
            throw new FlowError('Product Page - Open Product by Name', `Product with name "${productName}" was not found.`);
        }

        await product.open();

        return new ProductDetailsPage(this.page, productName);
    }

    async openRandomProduct(): Promise<ProductDetailsPage> {
        const products = await this.getProducts();
        const randomIndex = Math.floor(Math.random() * products.length);

        await products[randomIndex].open();

        return new ProductDetailsPage(this.page, products[randomIndex].name);
    }
}