import { Locator, Page } from "@playwright/test";
import { Product } from "../data/models/product.model";
import { CheckoutPage } from "../page-objects/checkout.page";
import { FlowError } from "../errors/flow.error";
import { DataUtil } from "../utils/data.utils";

export class CartComponent {
    readonly page: Page;
    readonly cartContainer: Locator;

    constructor(page: Page) {
        this.page = page;
        this.cartContainer = this.page.locator('div[role="dialog"]:has-text("Cart")');
    }

    isCurrentlyOpen: boolean = false;

    async getProductList(): Promise<Product[]> {
        const productList = await this.cartContainer.locator('ul').all();
        const products: Product[] = [];

        for (const product of productList) {
            let name = await product.locator('a.line-clamp-2').textContent();
            name = name!.toString();

            let color = await product.locator('p:has-text("Color:")').textContent();
            color = color!.replace('Color: ', '').trim();

            let quantity: any = await product.locator('button[aria-label="Decrease quantity"] ~ span').textContent();
            quantity = parseInt(quantity!.toString());

            let price: any = await product.locator('span:has-text("$"):not(.line-through)').textContent();
            price = DataUtil.convertTextDollarValueToFloat(price!.toString());

            products.push({ name, color, quantity, price });
        }

        return products;
    }

    async checkout(): Promise<CheckoutPage> {
        await this.cartContainer.locator('a:has-text("Checkout")').click();

        this.isCurrentlyOpen = false;
        const checkoutPage: CheckoutPage = new CheckoutPage(this.page);
        checkoutPage.waitToLoad();

        return checkoutPage;
    }

    async getSubtotal(): Promise<number> {
        let subtotalInDollars = await this.cartContainer.locator('div:has-text("Subtotal")').locator('span:has-text("$")').textContent();
        subtotalInDollars = subtotalInDollars!.toString();
        return DataUtil.convertTextDollarValueToFloat(subtotalInDollars);
    }

    async waitToOpen(): Promise<boolean> {
        try {
            await this.cartContainer.waitFor({ state: 'visible', timeout: 10000 });
            this.isCurrentlyOpen = true;
        } catch (error) {
            throw new FlowError('Cart Component - Wait to Open', 'The cart did not open within the expected time.');
        }

        return this.isCurrentlyOpen;
    }

    async getCardId(): Promise<string> {
        return DataUtil.getCartIdFromUrl(this.page.url());
    }
}