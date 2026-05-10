import { ProductTotals } from "../data/models/product-totals.model";

export class DataUtil {
    static randomString(length: number): string {
        return [...Array(length)]
            .map(() => Math.random().toString(36)[2])
            .join('');
    }

    static transformDataToken(value: string): string {
        if (value.includes('${now}')) {
            return value.replace('${now}', Date.now().toString());
        }

        return value;
    }

    static convertProductNameToUrlFormat(productName: string): string {
        return productName.toLowerCase().trim().replace(/\s+/g, '-').replace(/(\d+)\.\d+\s*l\b/g, '$1l');
    }

    static convertTextDollarValueToFloat(value: string): number {
        const parsed = parseFloat(value.replace('$', '').replace(',', ''));

        if (isNaN(parsed)) {
            throw new TypeError(`The text - ${value}, is not a number and cannot be parsed!`);
        }

        return parsed;
    }

    static getCartIdFromUrl(url: string): string {
        const match = url.match(/cart_([^/]+)/);
        const cartId = match ? match[1] : null;

        if (!cartId) {
            throw new TypeError('There is no Cart ID in the URL!');
        }

        return cartId;
    }

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

    static expandExpiryDate(mmYY: string): string {
        const match = mmYY.trim().match(/^(\d{2})\/(\d{2})$/);
        if (!match) throw new TypeError(`Invalid expiry format: "${mmYY}"`);

        const [, mm, yy] = match;
        const yyyy = 2000 + Number(yy);

        return `${mm}/${yyyy}`;
    }
}
