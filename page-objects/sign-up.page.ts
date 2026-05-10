import { Locator, Page } from "@playwright/test";
import { BaseSpreePage } from "./base-spree.page";
import { FormBuilder } from "../builders/ui/form.builder";
import { AccountDashboardPage } from "./account-dashboard.page";
import { FlowError } from "../errors/flow.error";
import { NewAccountDetails } from "../data/models/new-account.model";
import { DataUtil } from "../utils/data.utils";

/**
 * Page object for the signup flow.
 *
 * Builds the create account form and handles user registration with generated
 * credentials and post-submit verification.
 */
export class SignupPage extends BaseSpreePage {
  readonly url: string = `${this.baseUrl}/account/register`;
  readonly page: Page;
  readonly createAccountForm: Record<string, Locator>;

  constructor(Page: Page) {
    super(Page);
    this.page = Page;
    this.createAccountForm = new FormBuilder(this.page, 'div[data-slot="card"].bg-card:has-text("Create Account")')
      .addFields([
        { name: 'firstName', selector: '#firstName' },
        { name: 'lastName', selector: '#lastName' },
        { name: 'email', selector: '#email' },
        { name: 'password', selector: '#password' },
        { name: 'confirmPassword', selector: '#passwordConfirmation' },
        { name: 'policyConsentCheckbox', selector: '#policy-consent' }
      ])
      .addButton('createAccountButton', 'Create Account')
      .build();
  }

  /**
   * Create a new account and verify that it was registered successfully.
   *
   * Passwords are generated dynamically and the email token is transformed before submission.
   */
  async createAccount(accountDetails: NewAccountDetails): Promise<[NewAccountDetails, AccountDashboardPage]> {
    try {
      accountDetails.password = DataUtil.randomString(10);
      accountDetails.email = DataUtil.transformDataToken(accountDetails.email);

      await this.createAccountForm.firstName.fill(accountDetails.firstName);
      await this.createAccountForm.lastName.fill(accountDetails.lastName);
      await this.createAccountForm.email.fill(accountDetails.email);
      await this.createAccountForm.password.fill(accountDetails.password);
      await this.createAccountForm.confirmPassword.fill(accountDetails.password);
      await this.createAccountForm.policyConsentCheckbox.check();
      await this.createAccountForm.createAccountButton.click();

      const accountDashboardPage: AccountDashboardPage = new AccountDashboardPage(this.page);
      await accountDashboardPage.waitForPageLoad();

      if (await accountDashboardPage.getNameFromSideMenu() !== `${accountDetails.firstName} ${accountDetails.lastName}`
          && await accountDashboardPage.getEmailFromSideMenu() !== accountDetails.email) {
          throw new FlowError('Signup - Create Account'
              , `Account creation failed: User details were not found in the account dashboard side menu after signup.
              This may indicate that the account was not created successfully or there was an issue retrieving user details from the dashboard.`);
      }

      return [accountDetails, accountDashboardPage];
    }
    catch (error) {
      throw new FlowError('Signup - Create Account', `Error occurred while creating account: ${error}`);
    }
  }
}