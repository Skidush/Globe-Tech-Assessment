import { Locator, Page } from "@playwright/test";
import { DataUtil } from "../utils/data.utils";
import { Product } from "../data/models/product.model";
import { FlowError } from "../errors/flow.error";

export class OrderPlacedPage {
    readonly page: Page;
    readonly cartId: string;
    readonly url: string = 'https://demo.spreecommerce.org/us/en/order-placed/cart_';

    constructor(page: Page, cartId: string) {
        this.page = page;
        this.cartId = cartId
        this.url = this.url + cartId;
    }

    async getPaymentContainer(): Promise<Locator> {
        return await this.page.locator('h3:has-text("Payment")').locator('xpath=parent::div');
    }

    async getGratitudeMessage(): Promise<string> {
        let gratitudeMessage = await this.page.locator('h1:has-text("Thanks for your order")').textContent();
        gratitudeMessage = gratitudeMessage!.toString();

        return gratitudeMessage;
    }

    async getProductList(): Promise<Product[]> {
        const productList = await this.page.locator('p:has-text("Color:")').locator('xpath=ancestor::li[1]/ancestor::ul[1]').all();
        const products: Product[] = [];

        for (const product of productList) {
            let name = await product.locator('h3').textContent();
            name = name!.toString();

            let color = await product.locator('p:has-text("Color:")').textContent();
            color = color!.replace('Color: ', '').trim();

            let quantity: any = await product.locator('p:has-text("Qty:")').textContent();
            quantity = parseInt(quantity!.replace('Qty:', ''));

            let price: any = await product.locator('div:has-text("$")').textContent();
            price = DataUtil.convertTextDollarValueToFloat(price!);

            products.push({ name, color, quantity, price });
        }

        return products;
    }

    async getShippingMethod(): Promise<string> {
        let method = await this.page.locator('h3:has-text("Shipping Method")').locator('xpath=parent::div').locator('p').first().textContent();
        method = method!.toString();


        return method;
    }

    async getPaymentVisaEnding(): Promise<string> {
        let visaEndingIn: any = await (await this.getPaymentContainer()).locator('p:has-text("Visa ending in")').first().textContent();
        visaEndingIn = visaEndingIn!.toString();

        return visaEndingIn.split('in ')[1];
    }

    async getPaymentVisaExpiry(): Promise<string> {
        let expiry: any = await (await this.getPaymentContainer()).locator('p:has-text("Expires")').textContent();
        expiry = expiry!.toString();

        return expiry.split('Expires ')[1];
    }

    async getShippingAddress(): Promise<string> {
        const shippingAddress = await this.page.locator('h3:has-text("Shipping Address")').locator('xpath=parent::div').locator('div').textContent();

        return shippingAddress!.toString();
    }

    async getConfirmationEmailSentTo(): Promise<string> {
        const sentTo = await this.page.locator('p:has-text("Confirmation sent to ") span').textContent();

        return sentTo!.toString();
    }

    async getBillingAddress(): Promise<string> {
        const billingAddress = await this.page.locator('h3:has-text("Billing Address")').locator('xpath=parent::div').locator('div').textContent();

        return billingAddress!.toString();
    }

    async getSubtotal(): Promise<number> {
        return await this.getTotalByLabel('Subtotal');
    }

    async getShippingFee(): Promise<number> {
        return await this.getTotalByLabel('Shipping');
    }

    async getTax(): Promise<number> {
        return await this.getTotalByLabel('Tax');
    }

    async getTotal(): Promise<number> {
        return await this.getTotalByLabel('Total');
    }

    async waitToLoad(): Promise<OrderPlacedPage> {
        await this.page.waitForURL(this.url);

        return this;
    }

    private async getTotalByLabel(label: 'Subtotal' | 'Shipping' | 'Tax' | 'Total'): Promise<number> {
        label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const container = this.page.locator(`xpath=//span[normalize-space(.)="${label}"]/parent::div`);

        const valueSpan = container.locator('xpath=/span[last()]');
        const valueText = (await valueSpan.textContent())?.trim() ?? '';

        if (!valueText.includes('$')) throw new FlowError('Order Placed Page - Get Total by Label', `The total "${label}" doesnt have a value!`);

        return DataUtil.convertTextDollarValueToFloat(valueText);
    }
}