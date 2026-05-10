import { test as base, expect, Page } from '@playwright/test';
import { LandingPage } from '../../../page-objects/landing.page';

type UiFixtures = {
  landingPage: LandingPage;
  screenshotOnFailure: void;
};

export const test = base.extend<UiFixtures>({
  landingPage: async ({ page }, use) => {
    const landingPage = new LandingPage(page);

    await landingPage.goto(landingPage.url);

    await use(landingPage);
  },

  screenshotOnFailure: [async ({ page }, use, testInfo) => {
      await use();

      const failed = testInfo.status !== testInfo.expectedStatus;

      if (failed && !page.isClosed()) {
        const screenshot = await page.screenshot({ fullPage: true });
        await testInfo.attach('failure-screenshot', {
          body: screenshot,
          contentType: 'image/png',
        });
      }
    }, { auto: true }],

});

export { expect };
export type { Page };