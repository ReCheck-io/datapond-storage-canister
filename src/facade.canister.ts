import {
  blob,
  bool,
  Canister,
  Err,
  ic,
  int,
  nat,
  None,
  Ok,
  Principal,
  query,
  Result,
  Some,
  StableBTreeMap,
  text,
  update,
} from "azle";
import {
  CanisterStatusResult,
  managementCanister,
} from "azle/canisters/management";

import { Error, User, File, Service } from "./types";
import { bigIntToNumber, getCanisterStatus } from "./utils";

import StorageCanister from "./storage.canister";

const codeStorage = StableBTreeMap(int, blob, 0);
const userStorage = StableBTreeMap(text, User, 1);
const serviceStorage = StableBTreeMap(Principal, Service, 2);

export default Canister({
  /**
   * Initializes the canister by adding a new user during deployment.
   * @param serviceId - The Principal ID of the service with access.
   * @returns Result indicating success or an error.
   */
  initializeCanister: update(
    [Principal],
    Result(Service, Error),
    (serviceId) => {
      if (!ic.caller().compareTo(ic.id())) {
        return Err({ Unauthorized: "Unauthorized access!" });
      }

      if (serviceStorage.containsKey(serviceId)) {
        return Err({ Conflict: "User already exists!" });
      }

      const newService: typeof Service = {
        id: serviceId,
        createdAt: ic.time(),
      };

      serviceStorage.insert(serviceId, newService);

      return Ok(newService);
    },
  ),

  /**
   * Loads child canister's wasm output code and stores it.
   *
   * @param blob - The Blob containing the wasm code.
   * @returns Result indicating success or an error.
   */
  loadCanisterCode: update([blob], Result(bool, Error), (blob) => {
    if (!ic.caller().compareTo(ic.id())) {
      return Err({ Unauthorized: "Unauthorized access!" });
    }

    if (!blob || !(blob instanceof Blob)) {
      return Err({
        InvalidPayload: "Please enter a valid payload for canister code!",
      });
    }

    codeStorage.insert(0, blob);

    return Ok(true);
  }),

  /**
   * Tests canister deployment by creating and checking its status.
   *
   * @returns Result containing canister status or an error.
   */
  testCanisterDeploy: update(
    [],
    Result(CanisterStatusResult, Error),
    async () => {
      const canisterId = await deployCanister();

      if (!canisterId) {
        return Err({ NotKnown: "Failed to find or create canister." });
      }

      const canisterStatus = await getCanisterStatus(canisterId);

      return Ok(canisterStatus);
    },
  ),

  /**
   * Function to handle file uploads and dynamically create user canisters.
   *
   * @param file - The file data.
   * @param userId - The Principal ID of the user.
   * @param isChunked - A boolean indicating if the file upload is chunked.
   * @returns Result indicating success or an error.
   */
  uploadFile: update(
    [File, text, bool],
    Result(bool, Error),
    async (file, userId, isChunked) => {
      try {
        if (!serviceStorage.containsKey(ic.caller())) {
          return Err({ Unauthorized: "Unauthorized access!" });
        }

        const targetCanisterId = await findOrCreateCanister(userId, file.size);

        if (!targetCanisterId) {
          return Err({ NotKnown: "Failed to find or create canister." });
        }

        const uploadResult = await StorageCanister(targetCanisterId).uploadFile(
          targetCanisterId,
          file,
          isChunked,
        );

        if (uploadResult.Err) {
          return Err({
            UploadError: `Failed to upload file. Error: ${JSON.stringify(
              uploadResult.Err,
            )}`,
          });
        }

        return Ok(true);
      } catch (error) {
        return Err({ NotKnown: "An unexpected error occurred." });
      }
    },
  ),

  /**
   * Function to handle retrieving files.
   *
   * @param userId - The Principal ID of the user.
   * @param fileId - The MongoDB ID of the file.
   * @param canisterId - The Principal ID of the storage canister where the file is stored.
   * @returns Result indicating success or an error.
   */
  getFile: query(
    [text, text, text],
    Result(text, Error),
    async (userId, fileId, canisterId) => {
      try {
        if (!serviceStorage.containsKey(ic.caller())) {
          return Err({ Unauthorized: "Unauthorized access!" });
        }

        const user = userStorage.get(userId);

        if (!user || user.None || !user.Some || !user.Some.canisters.length) {
          return Err({
            NotFound: `Could not find user with given id=${userId}!`,
          });
        }

        const targetCanisterId = user.Some.canisters.find(
          (x: string) => x === canisterId,
        );

        if (!targetCanisterId) {
          return Err({
            NotFound: `Could not find canister with given id=${canisterId}`,
          });
        }

        const uploadResult = await StorageCanister(
          Principal.fromText(targetCanisterId),
        ).getFile(Principal.fromText(targetCanisterId), fileId);

        ic.print(uploadResult);

        return Ok("ok");
      } catch (error) {
        return Err({ NotKnown: "An unexpected error occurred." });
      }
    },
  ),
});

async function deployCanister(): Promise<Principal | null> {
  const createCanisterResult = await ic.call(
    managementCanister.create_canister,
    {
      args: [
        {
          settings: Some({
            controllers: Some([ic.id()]),
            compute_allocation: None,
            memory_allocation: None,
            freezing_threshold: None,
          }),
        },
      ],
      cycles: 100_000_000_000_000_000n,
    },
  );

  const canisterId = createCanisterResult.canister_id;

  const hasCode = codeStorage.get(0).Some;

  if (!hasCode) return null;

  const binaryBuffer = Buffer.from(hasCode.Some, "binary");
  const wasmModuleArray: number[] = Array.from(binaryBuffer);

  await ic.call(managementCanister.install_code, {
    args: [
      {
        mode: { install: null },
        canister_id: canisterId,
        wasm_module: Uint8Array.from(wasmModuleArray) as any,
        arg: Uint8Array.from([]),
      },
    ],
    cycles: 100_000_000_000n,
  });

  ic.print("Successfully deployed code to canister! " + canisterId);
  return canisterId;
}

async function findOrCreateCanister(
  userId: text,
  fileSize: bigint,
): Promise<Principal | null> {
  const user = userStorage.get(userId);

  if (!user || !user.Some) {
    const canisterId = await deployCanister();

    if (!canisterId) {
      return null;
    }

    const newUser: typeof User = {
      userId: userId,
      canistersMarkedFull: [],
      canisters: [canisterId.toString()],
    };

    userStorage.insert(userId, newUser);
    return canisterId;
  } else {
    return findCanisterWithFreeSpace(user.Some, fileSize);
  }
}

async function findCanisterWithFreeSpace(
  currentUser: typeof User,
  fileSize: nat,
): Promise<Principal | null> {
  for (const canisterId of currentUser.canisters) {
    const canisterPrincipal = Principal.fromText(canisterId);

    const canisterStatus = await getCanisterStatus(canisterPrincipal);
    const storageLimit = 96 * 1024 * 1024 * 1024;
    const threshold = 0.95;

    const availableStorage =
      storageLimit - bigIntToNumber(canisterStatus.memory_size);

    if (availableStorage >= fileSize) {
      return canisterPrincipal;
    } else if (
      availableStorage >= storageLimit * threshold &&
      !currentUser.canistersMarkedFull?.includes(canisterId)
    ) {
      currentUser.canistersMarkedFull = currentUser.canistersMarkedFull || [];
      currentUser.canistersMarkedFull.push(canisterId);
    }
  }

  const canisterId = await deployCanister();

  if (!canisterId) {
    return null;
  }

  currentUser.canisters.push(canisterId.toString());

  return canisterId;
}
