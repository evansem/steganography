/** Raised when a message does not fit in the cover image. */
export class CapacityError extends Error {
  constructor(
    readonly neededBytes: number,
    readonly availableBytes: number,
  ) {
    super(`Message needs ${neededBytes} bytes but the image only holds ${availableBytes}.`);
    this.name = "CapacityError";
  }
}

/** Raised when no Justeg payload can be found or it fails validation. */
export class NoMessageError extends Error {
  constructor(message = "No hidden message was found in this image.") {
    super(message);
    this.name = "NoMessageError";
  }
}
