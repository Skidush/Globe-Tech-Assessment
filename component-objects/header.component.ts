import { Page, Locator } from '@playwright/test';

export class HeaderComponent {
  readonly page: Page

  constructor(page: Page) {
    this.page = page;
  }

  get header(): Locator {
    return this.page.locator('header');
  }

  get myAccountButton(): Locator {
    return this.header.locator('a[aria-label="Account"]');
  }
}