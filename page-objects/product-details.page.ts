import { Locator, Page } from "@playwright/test";
import { BaseSpreePage } from "./base-spree.page";
import { DataUtil } from "../utils/data.utils";
import { ProductDetails } from "../data/models/product-details.model";

export class ProductDetailsPage extends BaseSpreePage {
    readonly url: string;
    readonly productDetailsContainer: Locator;

    constructor(page: Page, name: string) {
        super(page);
        this.url = `${this.baseUrl}/products/${DataUtil.convertProductNameToUrlFormat(name)}`;
        this.productDetailsContainer = this.page.locator('div:has(> div > h2:has-text("Description"))');
    }

    async getProductName(): Promise<string> {
        const name = await this.productDetailsContainer.locator('h1').textContent();
        return name!;
    }

    async getProductPrice(): Promise<string> {
        const price = await this.productDetailsContainer.locator('span:has-text("$")').first().textContent(); // First always (actual and discounted), second is the original price
        return price!.toString();
    }

    async getProductDetails(): Promise<ProductDetails> {
        const name = await this.getProductName();
        const price = await this.getProductPrice();
        const priceNumeric = DataUtil.convertTextDollarValueToFloat(price);

        return { name: name, price: price, priceNumeric: priceNumeric }
    }

    async addQuantity(quantity: number): Promise<number> {
        const increaseQuantityButton = this.productDetailsContainer.locator('button[aria-label="Increase quantity"]');
        await increaseQuantityButton.click({ clickCount: quantity });

        const quantityValue = await increaseQuantityButton.locator('xpath=preceding-sibling::span[1]').textContent();
        return parseInt(quantityValue!);
    }

    async addToCart(): Promise<ProductDetailsPage> {
        await this.productDetailsContainer.locator('button:has-text("Add to Cart")').click();
        await this.cart.waitToOpen();

        return this;
    }
}