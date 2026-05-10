export class FlowError extends Error {
  constructor(readonly action: string, message: string) {
    super(`[${action}] ${message}`);
    this.name = 'FlowError';
  }
}