import { test, expect } from '../fixtures/base-ui.fixture';
import newAccountData from '../../../data/templates/newAccount.json';
import paymentDetails from '../../../data/templates/paymentDetails.json';
import taxRates from '../../../data/templates/taxRates.json';
import messages from '../../../data/templates/messages.json';
import { AccountDashboardPage, CheckoutPage, MyAccountPage, OrderPlacedPage, ProductDetailsPage, ProductsPage, SignupPage } from '../../../page-objects/exports.page';
import { NewAccountDetails, Product, ProductDetails, ProductTotals } from '../../../data/models/exports.model';
import { CartComponent } from '../../../component-objects/exports.component';
import { DataUtil } from '../../../utils/data.utils';

test.describe('Checkout E2E Tests', () => {
  test('Newly signed-up users should be able to checkout items using Visa as the payment method.', async ({ landingPage, page }) => {
    // 1. Navigate to the Spree Commerce demo store.
    const myAccountPage: MyAccountPage = await landingPage.navigateToMyAccount();

    let [newAccountDetails, accountDashboardPage]: [NewAccountDetails, AccountDashboardPage] =
      // 2. Click on the user icon and Sign Up as a new user from the registration page from the side menu. (Log out if needed)
      await test.step('Register a new user.', async () => {
        const signUpPage: SignupPage = await myAccountPage.navigateToSignUp();
        const [newAccountDetails, accountDashboardPage] = await signUpPage.createAccount(newAccountData);

        await test.step('Verify that the user has been created', async () => {
          const nameInSideMenu = await accountDashboardPage.getNameFromSideMenu();
          const emailInSideMenu = await accountDashboardPage.getEmailFromSideMenu();

          await expect(page, 'The account dashboard page should be loaded after signing up!').toHaveURL(accountDashboardPage.url);

          await Promise.all([
            expect(nameInSideMenu, 'The first name displayed in the dasboard is incorrect!').toBe(`${newAccountDetails.firstName} ${newAccountDetails.lastName}`),
            expect(emailInSideMenu, 'The last name displayed in the dasboard is incorrect!').toBe(newAccountDetails.email)
          ]);
        });

        return [newAccountDetails, accountDashboardPage];
      });

    // 3. Log in with the newly registered user credentials.
    await test.step('Re-login the created user.', async () => {
      accountDashboardPage = await (await accountDashboardPage.logout()).signIn(newAccountDetails);
    });

    // 4. Browse products and open a product detail page.
    const [productQuantity, productDetails] = await test.step('Open a random product and add it to the cart', async () => {
      const productsPage: ProductsPage = await accountDashboardPage.navigateToProductsPage();
      await productsPage.loadAllProducts();

      const productDetailsPage: ProductDetailsPage = await productsPage.openRandomProduct();
      const productQuantity: number = await productDetailsPage.addQuantity(Math.floor(Math.random() * (10 + 1))); // Add random quantity between 0 - 10
      const productDetails: ProductDetails = await productDetailsPage.getProductDetails();

      // 5. Add the product to cart.
      await productDetailsPage.addToCart();

      // 6. Go to the cart and verify the product details (name, quantity, price).
      return await test.step('Verify that the cart displays the product details (name, quantity, and price) and subtotal correctly.', async () => {
        const cart: CartComponent = productDetailsPage.cart;
        const productListInCart: Product[] = await cart.getProductList();
        const productInCart: Product = productListInCart[0];
        const expectedTotalPrice: number = DataUtil.calculateProductTotals(productQuantity, productDetails.priceNumeric).total;

        await Promise.all([
          expect(productListInCart.length, 'Only one item was added to the cart but there are more or none!').toBe(1),
          expect(productInCart.name, 'The wrong item was added into the cart!').toBe(productDetails.name),
          expect(productInCart.quantity, 'The wrong quantity was added into the cart!').toBe(productQuantity),
          expect(productInCart.price, 'The wrong price was displayed for the item!').toBe(productDetails.priceNumeric),
          expect(await cart.getSubtotal(), 'The wrong subtotal price was calculated for the item!').toBe(expectedTotalPrice)
        ]);

        return [productQuantity, productDetails];
      });
    });

    // 7. Proceed to checkout and complete the following:
    // ○ Add a shipping address.
    // ○ Select a shipping method.
    // ○ Verify the different delivery and pricing options.
    // ○ Select a payment method. (Kindly refer test card details on the checkout)
    // ○ Complete the order.
    await test.step('Checkout the product.', async () => {
      const checkoutPage: CheckoutPage = await myAccountPage.cart.checkout();
      let productListInCheckoutPage: Product[] = await checkoutPage.getProductList();
      let productInCheckoutPage: Product = productListInCheckoutPage[0];

      await test.step('Verify that the checkout page displays the product details (name, quantity, and price) and subtotal correctly.', async () => {
        const expectedTotalPrice: number = DataUtil.calculateProductTotals(productQuantity, productDetails.priceNumeric).total;

        await Promise.all([
          expect(productListInCheckoutPage.length, 'Only one item was added to the cart but there are more or none in the checkout page!').toBe(1),
          expect(productInCheckoutPage.name, 'The wrong item is displayed in the checkout page!').toBe(productDetails.name),
          expect(productInCheckoutPage.quantity, 'The wrong quantity for the item is displayed in the checkout page!').toBe(productQuantity),
          expect(productInCheckoutPage.price, 'The wrong price is displayed for the item in the checkout page!').toBe(expectedTotalPrice),
          expect(await checkoutPage.getSubtotal(), 'The wrong subtotal price was calculated!').toBe(expectedTotalPrice),
          expect(await checkoutPage.getTotal(), 'The wrong total was calculated!').toBe(expectedTotalPrice)
        ]);
      });

      let calculatedProductTotals: ProductTotals;

      await test.step('Use Visa as the payment method and enter payment details then checkout the product.', async () => {
        let shippingMethodPrice = 0;
        await checkoutPage.fillOutCheckoutForm(paymentDetails);

        await test.step('Verify that the shipping fee is applied and the totals are recalculated correctly.', async () => {
          productListInCheckoutPage = await checkoutPage.getProductList();
          productInCheckoutPage = productListInCheckoutPage[0];

          shippingMethodPrice = await checkoutPage.getShippingMethodPrice(paymentDetails.shippingMethod);
          calculatedProductTotals = DataUtil.calculateProductTotals(productQuantity, productDetails.priceNumeric, taxRates.productTax, shippingMethodPrice)

          await Promise.all([
            expect(productInCheckoutPage.price, 'The wrong price is calculated for the item in the checkout page afterfilling out the payment details!').toBe(calculatedProductTotals.priceWithTax),
            expect(await checkoutPage.getSubtotal(), 'The wrong subtotal is calculated for the item in the checkout page afterfilling out the payment details!').toBe(calculatedProductTotals.priceWithoutTax),
            expect(await checkoutPage.getShippingFee(), 'The wrong shipping fee is applied!').toBe(shippingMethodPrice),
            expect(await checkoutPage.getTotal(), 'The wrong total is calculated!').toBe(calculatedProductTotals.total)
          ]);
        });

        const orderPlacedPage: OrderPlacedPage = await test.step('Checkout.', async () => {
          return checkoutPage.placeOrder();
        });

        await test.step('Verify that the user is redirected to the order recipt page on checkout.', async () => {
          try {
            await orderPlacedPage.waitToLoad();
          } catch (error) {
            throw new Error('The Order Placed page was not loaded after checking out!');
          }
        });

        // 8. Verify the order confirmation page is shown with an order number and success message.
        await test.step('Verify the order receipt details.', async () => {
          let productsInOrderPlacedPage: Product[] = await orderPlacedPage.getProductList();
          let productInOrderPlacedPage: Product = productsInOrderPlacedPage[0];

          const last4DigitsOfCard = paymentDetails.paymentMethod.creditCardDetails.cardNumber.slice(-4);
          const expectedShippingAddress =
            `${paymentDetails.shippingAddress.firstName} ${paymentDetails.shippingAddress.lastName}${paymentDetails.shippingAddress.addressLine1}${paymentDetails.shippingAddress.addressLine2}`
            + `${paymentDetails.shippingAddress.city}, ${paymentDetails.shippingAddress.stateAbbreviation} ${paymentDetails.shippingAddress.zipCode}${paymentDetails.shippingAddress.country}`;

          const expectedBillingAddress = expectedShippingAddress;

          await Promise.all([
            expect(await orderPlacedPage.getGratitudeMessage()).toBe(`${messages.gratitudeOnOrder} ${paymentDetails.shippingAddress.firstName}!`),
            expect(productListInCheckoutPage.length, 'Only one item was added checked-out but there are more or none in the receipt!').toBe(1),
            expect(productInOrderPlacedPage.name, 'The wrong item is displayed in the receipt!').toBe(productDetails.name),
            expect(productInOrderPlacedPage.quantity, 'The wrong quantity is displayed for the item in the receipt!').toBe(productQuantity),
            expect(productInOrderPlacedPage.price, 'The wrong price is calculated for the item in the receipt!').toBe(calculatedProductTotals.priceWithTax),
            expect(await orderPlacedPage.getSubtotal(), 'The wrong subtotal price is calculated in the receipt!').toBe(calculatedProductTotals.priceWithoutTax),
            expect(await orderPlacedPage.getTax(), 'The wrong tax was calculated in the receipt!').toBe(calculatedProductTotals.taxPrice),
            expect(await orderPlacedPage.getShippingFee(), 'The wrong shipping fee is reflected on the receipt!').toBe(shippingMethodPrice),

            expect(await orderPlacedPage.getTotal(), 'The wrong total was calculated in the receipt!').toBe(calculatedProductTotals.total),
            expect(await orderPlacedPage.getShippingMethod(), 'The wrong shipping method is reflected in the receipt!').toBe(paymentDetails.shippingMethod),
            expect(await orderPlacedPage.getPaymentVisaEnding(), 'The wrong visa ending fee is reflected on the receipt!').toBe(last4DigitsOfCard),
            expect(await orderPlacedPage.getPaymentVisaExpiry(), 'The wrong visa expiry date is reflected on the receipt!').toBe(DataUtil.expandExpiryDate(paymentDetails.paymentMethod.creditCardDetails.expiryDate)),
            expect(await orderPlacedPage.getShippingAddress(), 'The wrong shipping address is reflected on the receipt!').toBe(expectedShippingAddress),
            expect(await orderPlacedPage.getBillingAddress(), 'The wrong billing address is reflected on the receipt!').toBe(expectedBillingAddress),
            expect(await orderPlacedPage.getConfirmationEmailSentTo(), 'The wrong email address is reflected on the receipt!').toBe(newAccountDetails.email)
          ]);
        });
      });
    });
  });
});
