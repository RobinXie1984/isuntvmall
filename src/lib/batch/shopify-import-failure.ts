import "server-only";
import { BatchError } from "./contracts";
import { batchFailure } from "./server";

// Only these domain codes may leave the import API. Never return SQL details,
// source rows, constraint names or an arbitrary provider error message.
const held = new Set([
  "SOURCE_CONFLICT", "EXISTING_PRODUCT_CONFLICT", "SOURCE_IDENTITY_CONFLICT",
  "STAGED_PRODUCT_UNAVAILABLE", "REQUEST_CONFLICT", "DUPLICATE_HANDLE",
  "INVALID_PRODUCT", "INVALID_INPUT",
]);
export function shopifyImportFailure(error: unknown) {
  if (error && typeof error === "object" && "message" in error &&
      typeof error.message === "string" && held.has(error.message)) {
    return batchFailure(new BatchError(error.message, 409));
  }
  return batchFailure(error);
}
