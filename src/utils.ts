import { ErrorType, Serializable } from "./types";

export const Uint8ArraySerializer: Serializable<Uint8Array> = {
  toBytes(data: Uint8Array): Uint8Array {
    return data;
  },
  fromBytes(bytes: Uint8Array): Uint8Array {
    return bytes;
  },
};

export function bigIntToNumber(value: bigint): number {
  if (!value) return 0;

  return Number(value.toString());
}

/**
 * Helper function to handle and format errors consistently.
 * @param error - The caught error.
 * @returns The formatted error object.
 */
export function handleError(error: any): ErrorType {
  // Check if the error is an object and has a recognized key
  if (error && typeof error === "object") {
    const keys = Object.keys(error); // Get keys from the error object

    // Check if the error contains a known variant key
    if (keys.includes("NotFound")) {
      return { NotFound: error.NotFound };
    } else if (keys.includes("NotKnown")) {
      return { NotKnown: error.NotKnown };
    } else if (keys.includes("Conflict")) {
      return { Conflict: error.Conflict };
    } else if (keys.includes("UploadError")) {
      return { UploadError: error.UploadError };
    } else if (keys.includes("Unauthorized")) {
      return { Unauthorized: error.Unauthorized };
    } else if (keys.includes("InvalidPayload")) {
      return { InvalidPayload: error.InvalidPayload };
    }
  }

  // Default error if structure doesn't match or no known variants are found
  return {
    InvalidPayload:
      "An unknown error occurred. " + JSON.stringify(error, null, 4),
  };
}
