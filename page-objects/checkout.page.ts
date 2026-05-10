import { Locator, Page } from "@playwright/test";
import { FormBuilder } from "../builders/ui/form.builder";
import { Product } from "../data/models/product.model";
import { DataUtil } from "../utils/data.utils";
import { PaymentDetails } from "../data/models/payment-details.model";
import { FlowError } from "../errors/flow.error";
import { OrderPlacedPage } from "./order-placed.page";

export class CheckoutPage {
    readonly page: Page;
    readonly contactAndShippingForm: Record<string, Locator>;
    readonly shippingMethodForm: Record<string, Locator>;
    readonly paymentMethodForm: Record<string, Locator>;
    readonly stripeCardPaymentForm: Record<string, Locator>;
    readonly shippingSectionSelector = '#checkout-section-shipping';
    readonly paymentSectionContainerSelector = `div#checkout-section-payment`
    readonly shippingMethodStandardSelector = 'div[role="radiogroup"] button:has(+ span:has-text("Standard"))';
    readonly shippingMethodPremiumSelector = 'div[role="radiogroup"] button:has(+ span:has-text("Premium"))';

    constructor(page: Page) {
        this.page = page;

        this.contactAndShippingForm = new FormBuilder(this.page, '#checkout-section-address')
            .addFields([
                { name: 'country', selector: '#ship-country' },
                { name: 'firstName', selector: '#ship-first_name' },
                { name: 'lastName', selector: '#ship-last_name' },
                { name: 'company', selector: '#ship-company' },
                { name: 'city', selector: '#ship-city' },
                { name: 'state', selector: '#ship-state' },
                { name: 'address1', selector: '#ship-address1' },
                { name: 'address2', selector: '#ship-address2' },
                { name: 'phone', selector: '#ship-phone' },
                { name: 'zipCode', selector: '#ship-postal_code' },
            ])
            .build();

        this.shippingMethodForm = new FormBuilder(this.page, this.shippingSectionSelector)
            .addFields([
                { name: 'standard', selector: this.shippingMethodStandardSelector },
                { name: 'premium', selector: this.shippingMethodPremiumSelector },
            ])
            .build();

        this.paymentMethodForm = new FormBuilder(this.page, this.paymentSectionContainerSelector)
            .addFields([
                { name: 'onterms', selector: 'div[role="radiogroup"] button:has(+ span:has-text("On terms (Net 30)"))' },
                { name: 'stripe', selector: 'div[role="radiogroup"] button:has(+ span:has-text("Stripe"))' },
                { name: 'paypal', selector: 'div[role="radiogroup"] button:has(+ span:has-text("PayPal"))' },
                { name: 'adyen', selector: 'div[role="radiogroup"] button:has(+ span:has-text("Adyen"))' }
            ])
            .addButton('acceptTOS', 'I agree to the Privacy Policy and Terms of Service', 'policy-consent')
            .build();

        this.stripeCardPaymentForm = new FormBuilder(this.page, this.paymentSectionContainerSelector, 'iframe[name^="__privateStripeFrame"]:not([aria-hidden="true"])')
            .addFields([
                { name: 'cardNumber', selector: '#payment-numberInput' },
                { name: 'expirationDate', selector: '#payment-expiryInput' },
                { name: 'securityCode', selector: '#payment-cvcInput' },
                { name: 'country', selector: '#payment-countryInput' }
            ])
            .build();
    }

    async getShippingMethodPrice(method: string) {
        if (method != 'Standard' && method != 'Premium') {
            throw new TypeError('The method passed was neither Standard nor Premium!');
        }

        const methodSelector = method == 'Standard' ? this.shippingMethodStandardSelector : this.shippingMethodPremiumSelector;
        const methodPriceLocator: Locator = await this.page.locator(this.shippingSectionSelector)
            .locator(methodSelector)
            .locator('xpath=ancestor::label[1]')
            .locator('span:has-text("$")');
        const methodPrice = await methodPriceLocator.textContent();

        return DataUtil.convertTextDollarValueToFloat(methodPrice!.toString());
    }

    async getProductList(): Promise<Product[]> {
        const productList = await this.page.locator('p:has-text("Color:")').locator('xpath=ancestor::div[.//img][1]').all();
        const products: Product[] = [];

        for (const product of productList) {
            let name = await product.locator('p.leading-snug').textContent();
            name = name!.toString();

            let color = await product.locator('p:has-text("Color:")').textContent();
            color = color!.replace('Color: ', '').trim();

            const quantityTextContent: string | null = await product.locator('div.rounded-full.flex.items-center').textContent();
            const quantity = parseInt(quantityTextContent!.toString());

            const priceTextContent: string | null = await product.locator('div:has-text("$")').textContent();
            const price = DataUtil.convertTextDollarValueToFloat(priceTextContent!.toString());

            products.push({ name, color, quantity, price });
        }

        return products;
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
        const container = this.page.locator(`xpath=//span[normalize-space(.)="Total"]/parent::div`);
        let total = await container.locator('div').textContent();
        total = total!.replace('USD', '');

        if (!total.includes('$')) throw new FlowError('Checkout Page - Get Total', 'The total doesnt have a value!');

        return DataUtil.convertTextDollarValueToFloat(total);
    }

    async fillOutCheckoutForm(details: PaymentDetails) {
        const shippingDetails = details.shippingAddress;
        await this.contactAndShippingForm.country.selectOption(shippingDetails.country);
        await this.contactAndShippingForm.firstName.fill(shippingDetails.firstName);
        await this.contactAndShippingForm.lastName.fill(shippingDetails.lastName);
        await this.contactAndShippingForm.address1.fill(shippingDetails.addressLine1);
        await this.contactAndShippingForm.address2.fill(shippingDetails.addressLine2);
        await this.contactAndShippingForm.city.fill(shippingDetails.city);

        await this.contactAndShippingForm.state.click();
        await this.contactAndShippingForm.state.selectOption(shippingDetails.state);

        await this.contactAndShippingForm.zipCode.fill(shippingDetails.zipCode);

        await this.page.locator(this.paymentSectionContainerSelector).click();

        await this.shippingMethodForm[details.shippingMethod.toLowerCase()].click({timeout: 15000});

        const paymentVendor = details.paymentMethod.vendor.toLowerCase();
        await this.paymentMethodForm[paymentVendor].click();

        switch(paymentVendor) {
            case 'stripe': {
                const creditCardDetails = details.paymentMethod.creditCardDetails;
                await this.stripeCardPaymentForm.cardNumber.waitFor({ state: 'visible', timeout: 30000 });
                await this.stripeCardPaymentForm.cardNumber.fill(creditCardDetails.cardNumber);
                await this.stripeCardPaymentForm.expirationDate.fill(creditCardDetails.expiryDate);
                await this.stripeCardPaymentForm.securityCode.fill(creditCardDetails.cvv);
                await this.stripeCardPaymentForm.country.selectOption(creditCardDetails.country);
                break;
            }
            default:
                throw new FlowError(`Checkout Page - Fill out checkout form`, `There is no "${paymentVendor}" payment vendor!`);
        }
    }

    async placeOrder(): Promise<OrderPlacedPage> {
        const cartId = DataUtil.getCartIdFromUrl(this.page.url());
        await this.page.locator('button:has-text("Pay Now")').click();

        return new OrderPlacedPage(this.page, cartId);
    }

    async waitToLoad(): Promise<CheckoutPage> {
        await this.page.waitForURL(/checkout/);
        await this.contactAndShippingForm.country.waitFor({ state: "visible" });
        return this;
    }

    private async getTotalByLabel(label: 'Subtotal' | 'Shipping' | 'Tax' | 'Total'): Promise<number> {
        label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const container = this.page.locator(`xpath=//span[normalize-space(.)="${label}"]/parent::div`);

        const valueSpan = container.locator('xpath=./span[last()]');
        const valueText = (await valueSpan.textContent())?.trim() ?? '';

        if (!valueText.includes('$')) throw new FlowError('Checkout Page - Get Total by Label', 'The total doesnt have a value!');

        return DataUtil.convertTextDollarValueToFloat(valueText);
    }
}