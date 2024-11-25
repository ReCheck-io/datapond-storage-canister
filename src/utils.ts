import { call, Principal } from "azle";
import {
  CanisterStatusArgs,
  CanisterStatusResult,
  CreateCanisterArgs,
  CreateCanisterResult,
  DepositCyclesArgs,
  InstallCodeArgs,
} from "azle/canisters/management";

import { ErrorType } from "./types";

export async function createCanister(): Promise<CreateCanisterResult> {
  return await call("aaaaa-aa", "create_canister", {
    paramIdlTypes: [CreateCanisterArgs],
    returnIdlType: CreateCanisterResult,
    args: [{ settings: [], sender_canister_version: [] }],
    payment: 50_000_000_000_000n,
  });
}

export async function installCode(
  canisterId: Principal,
  wasmModule: Uint8Array,
): Promise<boolean> {
  await call("aaaaa-aa", "install_code", {
    paramIdlTypes: [InstallCodeArgs],
    args: [
      {
        mode: {
          install: null,
        },
        canister_id: canisterId,
        wasm_module: wasmModule,
        arg: Uint8Array.from([]),
        sender_canister_version: [],
      },
    ],
    payment: 100_000_000_000n,
  });

  return true;
}

export async function getCanisterStatus(
  canisterId: Principal,
): Promise<CanisterStatusResult> {
  return await call("aaaaa-aa", "canister_status", {
    paramIdlTypes: [CanisterStatusArgs],
    returnIdlType: CanisterStatusResult,
    args: [{ canister_id: canisterId }],
  });
}

export async function depositCycles(
  canisterId: Principal,
  cycleAmount: bigint = 15_000_000n,
): Promise<boolean> {
  await call("aaaaa-aa", "deposit_cycles", {
    paramIdlTypes: [DepositCyclesArgs],
    args: [
      {
        canister_id: canisterId,
      },
    ],
    payment: cycleAmount,
  });

  return true;
}

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
  return { InvalidPayload: "An unknown error occurred." };
}
