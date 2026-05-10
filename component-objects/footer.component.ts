import { Page, Locator } from "@playwright/test";

export class FooterComponent {
  readonly page: Page

  constructor(page: Page) {
    this.page = page;
  }

  get footer(): Locator {
    return this.page.locator('footer');
  }
}