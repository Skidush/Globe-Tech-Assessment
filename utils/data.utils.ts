import { ProductTotals } from "../data/models/product-totals.model";

/**
 * Utility helper for data transformation and value parsing used across tests.
 */
export class DataUtil {
    /**
     * Generate a simple random alphanumeric string.
     *
     * @param length Number of characters to generate.
     */
    static randomString(length: number): string {
        return [...Array(length)]
            .map(() => Math.random().toString(36)[2])
            .join('');
    }

    /**
     * Replace the ${now} token in a string with the current timestamp.
     *
     * Useful for generating unique test data values.
     */
    static transformDataToken(value: string): string {
        if (value.includes('${now}')) {
            return value.replace('${now}', Date.now().toString());
        }

        return value;
    }

    /**
     * Convert a product name to URL slug format used for product detail pages.
     */
    static convertProductNameToUrlFormat(productName: string): string {
        return productName.toLowerCase().trim().replace(/\s+/g, '-').replace(/(\d+)\.\d+\s*l\b/g, '$1l');
    }

    /**
     * Parse a dollar amount string such as "$1,234.56" into a numeric value,
     * turning it into 1234.56
     */
    static convertTextDollarValueToFloat(value: string): number {
        const parsed = parseFloat(value.replace('$', '').replace(',', ''));

        if (isNaN(parsed)) {
            throw new TypeError(`The text - ${value}, is not a number and cannot be parsed!`);
        }

        return parsed;
    }

    /**
     * Extract the cart identifier from a the cart URL.
     *
     * Example: https://demo.spreecommerce.org/us/en/checkout/cart_abc123 -> abc123
     */
    static getCartIdFromUrl(url: string): string {
        const match = url.match(/cart_([^/]+)/);
        const cartId = match ? match[1] : null;

        if (!cartId) {
            throw new TypeError('There is no Cart ID in the URL!');
        }

        return cartId;
    }

    /**
     * Calculate product totals using quantity, price, optional tax rate, and optional shipping.
     *
     * If tax or shipping are omitted, those values default to 0.
     */
    static calculateProductTotals(quantity: number, price: number): ProductTotals;
    static calculateProductTotals(quantity: number, price: number, taxRatePercent: number, shippingPrice: number): ProductTotals;

    static calculateProductTotals(quantity: number, price: number, taxRatePercent: number = 0, shippingPrice: number = 0): ProductTotals {
        const priceWithoutTax = Number((quantity * price).toFixed(2));
        let taxRate;
        let taxPrice = 0;

        if (taxRatePercent != 0) {
            taxRate = taxRatePercent / 100;
            taxPrice = Number((priceWithoutTax * taxRate).toFixed(2));
        }

        const priceWithTax = Number((priceWithoutTax + taxPrice).toFixed(2));
        const total =
            shippingPrice == 0
                ? +(quantity * price).toFixed(2)
                : Math.round((priceWithTax + shippingPrice + Number.EPSILON) * 100) / 100;

        return {
            priceWithoutTax: priceWithoutTax,
            priceWithTax: priceWithTax,
            taxPrice: taxPrice,
            total: total
        };
    }

    /**
     * Convert a two-digit expiry string like "03/26" into a full year format such as "03/2026".
     */
    static expandExpiryDate(mmYY: string): string {
        const match = mmYY.trim().match(/^(\d{2})\/(\d{2})$/);
        if (!match) throw new TypeError(`Invalid expiry format: "${mmYY}"`);

        const [, mm, yy] = match;
        const yyyy = 2000 + Number(yy);

        return `${mm}/${yyyy}`;
    }
}
