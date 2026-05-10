/**
 * Custom error type for application flow failures and page interaction issues.
 *
 * Includes an action context and an informative error message.
 */
export class FlowError extends Error {
  /**
   * @param action A short identifier for the failed action.
   * @param message An explanatory error message.
   */
  constructor(readonly action: string, message: string) {
    super(`[${action}] ${message}`);
    this.name = 'FlowError';
  }
}