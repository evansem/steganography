import { ImageInputError } from "@/lib/image";
import { CapacityError, NoMessageError } from "@/lib/stego";

/** Turns any thrown value into a sentence safe to show the user. */
export function friendlyError(error: unknown): string {
  if (error instanceof CapacityError) {
    return `Too long by ${(error.neededBytes - error.availableBytes).toLocaleString()} bytes. Shorten the message, switch to 2-bit capacity, or use a bigger image.`;
  }
  if (error instanceof NoMessageError || error instanceof ImageInputError) return error.message;
  return "Something went wrong while processing the image.";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
