export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message = `HTTP error! Status: ${status}`,
    public readonly statusText?: string
  ) {
    super(message);
    this.name = 'HttpError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
