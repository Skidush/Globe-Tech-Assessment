import { Locator, Page } from "@playwright/test";
import { BaseSpreePage } from "./base-spree.page";
import { MyAccountPage } from "./my-account.page";
import { ProductsPage } from "./products.page";

/**
 * Page object for the user account dashboard screen.
 *
 * Provides account summary access, navigation to orders, and logout functionality.
 */
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

    /**
     * Retrieve the current user's name from the account dashboard side menu.
     */
    async getNameFromSideMenu(): Promise<string | null> {
        return await (await this.getSideMenuHeader()).locator('p').nth(0).textContent();
    }

    /**
     * Retrieve the current user's email from the account dashboard side menu.
     */
    async getEmailFromSideMenu(): Promise<string | null> {
        return await (await this.getSideMenuHeader()).locator('p').nth(1).textContent();
    }

    /**
     * Sign the current user out and return the MyAccount page object.
     */
    async logout(): Promise<MyAccountPage> {
        await this.sideMenu.locator('button:has-text("Sign Out")').click();

        const myAccountPage = new MyAccountPage(this.page);
        myAccountPage.waitForPageLoad();

        return myAccountPage;
    }

    /**
     * Navigate to the order history section within the account dashboard.
     */
    async openOrdersScreen(): Promise<AccountDashboardPage> {
        await this.sideMenu.locator('a[href="/us/en/account/orders"]').click();
        await this.orderHistoryScreen.waitToBeLoaded();

        this.currentlyOpenScreen = 'Orders';
        return this;
    }

    /**
     * Open the product catalog from the orders section of the dashboard.
     */
    async navigateToProductsPage(): Promise<ProductsPage> {
        if (this.currentlyOpenScreen !== 'Orders') {
            await this.openOrdersScreen();
        }

        return await this.orderHistoryScreen.startShopping();
    }
}

/**
 * Encapsulates the order history section behavior for the account dashboard.
 * The account dashboard renders different screens such as the Order History screen.
 */
class OrderHistoryScreen {
    readonly page: Page;
    readonly screenParent: Locator;
    readonly url: string;


    constructor(page: Page, baseUrl: string) {
        this.page = page;
        this.url = `${baseUrl}/orders`;
        this.screenParent = this.page.locator('main div').filter({ has: this.page.locator('h1:has-text("Order History")') });
    }

    /**
     * Click the "Start Shopping" link from the order history screen and navigate to products.
     */
    async startShopping(): Promise<ProductsPage> {
        await this.screenParent.locator('a[href="/us/en/products"]').click();

        const productsPage = new ProductsPage(this.page);
        await productsPage.waitForPageLoad();

        return productsPage;
    }

    /**
     * Wait until the order history URL is loaded, indicating the Orders screen is visible.
     */
    async waitToBeLoaded(): Promise<void> {
        await this.page.waitForURL(this.url);
    }
}