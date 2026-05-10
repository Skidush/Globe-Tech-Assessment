import { Page, Locator } from '@playwright/test';
import { BaseSpreePage } from './base-spree.page';
import { MyAccountPage } from './my-account.page';

export class LandingPage extends BaseSpreePage {
  readonly url: string = this.baseUrl;

  constructor(page: Page) {
    super(page);
  }

  async navigateToMyAccount(): Promise<MyAccountPage> {
    await this.page.waitForLoadState('networkidle');
    await this.header.myAccountButton.click();
    return new MyAccountPage(this.page);
  }
}
