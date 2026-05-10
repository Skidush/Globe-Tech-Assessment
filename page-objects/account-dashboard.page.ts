import { Locator, Page } from "@playwright/test";
import { BaseSpreePage } from "./base-spree.page";
import { MyAccountPage } from "./my-account.page";
import { ProductsPage } from "./products.page";

export class AccountDashboardPage extends BaseSpreePage {
    private readonly orderHistoryScreen: OrderHistoryScreen
    readonly url: string = `${this.baseUrl}/account`;

    currentlyOpenScreen: 'Orders' | 'Overview' | 'Addresses' = "Overview";

    constructor(page: Page) {
        super(page);
        this.orderHistoryScreen = new OrderHistoryScreen(this.page, this.url);
    }

    private get sideMenu(): Locator {
        return this.page.locator('aside');
    }

    private async getSideMenuHeader(): Promise<Locator> {
        return await this.sideMenu.locator('div').nth(1);
    }

    async getNameFromSideMenu(): Promise<string | null> {
        return await (await this.getSideMenuHeader()).locator('p').nth(0).textContent();
    }

    async getEmailFromSideMenu(): Promise<string | null> {
        return await (await this.getSideMenuHeader()).locator('p').nth(1).textContent();
    }

    async logout(): Promise<MyAccountPage> {
        await this.sideMenu.locator('button:has-text("Sign Out")').click();

        const myAccountPage = new MyAccountPage(this.page);
        myAccountPage.waitForPageLoad();

        return myAccountPage;
    }

    async openOrdersScreen(): Promise<AccountDashboardPage> {
        await this.sideMenu.locator('a[href="/us/en/account/orders"]').click();
        await this.orderHistoryScreen.waitToBeLoaded();

        this.currentlyOpenScreen = 'Orders';
        return this;
    }

    async navigateToProductsPage(): Promise<ProductsPage> {
        if (this.currentlyOpenScreen !== 'Orders') {
            await this.openOrdersScreen();
        }

        return await this.orderHistoryScreen.startShopping();
    }
}

class OrderHistoryScreen {
    readonly page: Page;
    readonly screenParent: Locator;
    readonly url: string;


    constructor(page: Page, baseUrl: string) {
        this.page = page;
        this.url = `${baseUrl}/orders`;
        this.screenParent = this.page.locator('main div').filter({ has: this.page.locator('h1:has-text("Order History")') });
    }

    async startShopping(): Promise<ProductsPage> {
        await this.screenParent.locator('a[href="/us/en/products"]').click();

        const productsPage = new ProductsPage(this.page);
        await productsPage.waitForPageLoad();

        return productsPage;
    }

    async waitToBeLoaded(): Promise<void> {
        await this.page.waitForURL(this.url);
    }
}