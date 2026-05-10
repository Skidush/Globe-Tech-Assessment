import { Page } from "@playwright/test";

export class ProductBlock {
    readonly page: Page;
    readonly name: string;
    readonly price: string;

    constructor(page: Page, name: string, price: string) {
        this.page = page;
        this.name = name;
        this.price = price;
    }

    async open(): Promise<void> {
        await this.page.locator(`a`, { has: this.page.locator('h3', { hasText: this.name }) }).first().click();
    }
}