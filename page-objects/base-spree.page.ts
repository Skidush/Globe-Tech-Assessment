import { Page } from '@playwright/test';
import { HeaderComponent } from '../component-objects/header.component';
import { FooterComponent } from '../component-objects/footer.component';
import { CartComponent } from '../component-objects/cart.component';

/**
 * Base page object for Spree pages.
 *
 * Provides shared navigation helpers and common page components such as header,
 * footer, and cart access.
 */
export class BaseSpreePage {
  readonly page: Page;
  readonly baseUrl: string = 'https://demo.spreecommerce.org/us/en';
  readonly url: string;
  readonly header: HeaderComponent;
  readonly footer: FooterComponent;
  readonly cart: CartComponent;

  constructor(page: Page, url: string = '') {
    this.page = page;
    this.url = url;
    this.header = new HeaderComponent(this.page);
    this.footer = new FooterComponent(this.page);
    this.cart = new CartComponent(this.page);
  }

  /**
   * Navigate the browser to the specified URL.
   *
   * @param url The target URL to navigate to.
   */
  async goto(url: string) {
    await this.page.goto(url);
  }

  /**
   * Navigate to the current page object's configured URL.
   */
  async goToPage() {
    await this.goto(this.url);
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async getUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Wait for the page to finish loading and for the browser URL to reflect the
   * expected page object's URL.
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForURL(this.url);
  }
}