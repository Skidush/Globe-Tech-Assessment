import { Locator, Page } from "@playwright/test";
import { BaseSpreePage } from "./base-spree.page";
import { SignupPage } from "./sign-up.page";
import { FormBuilder } from "../builders/ui/form.builder";
import { UserAccountDetails } from "../data/models/user-account.model";
import { AccountDashboardPage } from "./account-dashboard.page";

export class MyAccountPage extends BaseSpreePage {
  readonly url: string = `${this.baseUrl}/account`;
  readonly page: Page;
  readonly myAccountForm: Record<string, Locator>;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.myAccountForm = new FormBuilder(this.page, 'div[data-slot="card"]:has-text("My Account")')
      .addFields([
        { name: 'email', selector: '#email' },
        { name: 'password', selector: '#password' }
      ])
      .addButton('signInButton', 'Sign In')
      .addLink('signUpLink', '/us/en/account/register')
      .build();
  }

  async navigateToSignUp(): Promise<SignupPage> {
    await this.page.waitForLoadState('networkidle');
    await this.myAccountForm.signUpLink.click();
    return new SignupPage(this.page);
  }

  async signIn(user: UserAccountDetails): Promise<AccountDashboardPage> {
    await this.myAccountForm.email.fill(user.email);
    await this.myAccountForm.password.fill(user.password);
    await this.myAccountForm.signInButton.click();
    return new AccountDashboardPage(this.page);
  }
}