export class FlowError extends Error {
  constructor(readonly action: string, message: string, readonly meta?: Record<string, any>, readonly cause?: unknown) {
    super(`[${action}] ${message}`);
    this.name = 'FlowError';
  }
}