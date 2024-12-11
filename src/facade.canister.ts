import {
  IDL,
  call,
  Principal,
  query,
  update,
  StableBTreeMap,
  time,
  caller,
  id,
  isController,
} from "azle";
import { CanisterStatusResult } from "azle/canisters/management";

import {
  User,
  Service,
  FilePayload,
  ServiceResult,
  FileChunkResult,
  FileResult,
  BoolResult,
} from "./types";
import {
  bigIntToNumber,
  createCanister,
  depositCycles,
  getCanisterStatus,
  handleError,
  installCode,
} from "./utils";

export default class {
  private wasmModule: Uint8Array | null = null; // Global variable for Wasm module

  userStorage = StableBTreeMap<string, User>(1);
  serviceStorage = StableBTreeMap<Principal, Service>(2);

  @update([], CanisterStatusResult)
  async getStatus(): Promise<CanisterStatusResult> {
    return getCanisterStatus(id());
  }

  @update([IDL.Principal], ServiceResult)
  initializeCanister(serviceId: Principal): ServiceResult {
    try {
      if (!isController(caller())) {
        throw { Unauthorized: "Unauthorized access!" };
      }

      if (this.serviceStorage.containsKey(serviceId)) {
        throw { Conflict: "Service already exists!" };
      }

      const newService: Service = {
        id: serviceId,
        createdAt: time(),
      };
      this.serviceStorage.insert(serviceId, newService);
      return { Ok: newService };
    } catch (error) {
      return { Err: handleError(error) };
    }
  }

  @update([IDL.Vec(IDL.Nat8)], BoolResult)
  loadCanisterCode(blobData: Uint8Array): BoolResult {
    try {
      if (
        !this.wasmModule &&
        this.serviceStorage.keys().length > 0 &&
        !this.serviceStorage.containsKey(caller())
      ) {
        throw { Unauthorized: "Unauthorized access!" };
      }

      if (!blobData || blobData.length === 0) {
        throw {
          InvalidPayload: `Invalid payload for canister code! Blob size: ${
            blobData?.length || "unknown"
          } bytes.`,
        };
      }

      this.wasmModule = blobData;
      return { Ok: true };
    } catch (error) {
      return { Err: handleError(error) };
    }
  }

  @update([FilePayload, IDL.Text, IDL.Bool], FileResult)
  async uploadFile(
    file: FilePayload,
    userId: string,
    isChunked: boolean,
  ): Promise<FileResult> {
    try {
      if (!this.serviceStorage.containsKey(caller())) {
        throw { Unauthorized: "Unauthorized access!" };
      }

      const targetCanisterId = await this.findOrCreateCanister(
        userId,
        file.size,
      );

      if (!targetCanisterId) {
        throw { NotKnown: "Failed to find or create canister." };
      }

      const uploadResult = await call(targetCanisterId, "uploadFile", {
        paramIdlTypes: [FilePayload, IDL.Bool],
        returnIdlType: BoolResult,
        args: [file, isChunked],
      });

      if (uploadResult.Err) {
        throw {
          UploadError: `Failed to upload file. Error: ${JSON.stringify(
            uploadResult.Err,
          )}`,
        };
      }

      return {
        Ok: {
          id: file.id,
          name: file.name,
          canisterId: targetCanisterId.toText(),
        },
      };
    } catch (error) {
      return { Err: handleError(error) };
    }
  }

  @query([IDL.Text, IDL.Text, IDL.Text, IDL.Nat], FileChunkResult)
  async getFile(
    userId: string,
    fileId: string,
    canisterId: string,
    chunkNumber: number,
  ): Promise<FileChunkResult> {
    try {
      if (!this.serviceStorage.containsKey(caller())) {
        throw { Unauthorized: "Unauthorized access!" };
      }

      const user = this.userStorage.get(userId);
      if (!user) {
        throw { NotFound: `Could not find user with given id=${userId}!` };
      }

      const targetCanisterId = user.canisters.find((id) => id === canisterId);
      if (!targetCanisterId) {
        throw {
          NotFound: `Could not find canister with given id=${canisterId}`,
        };
      }

      const fileResult = await call(targetCanisterId, "getFile", {
        paramIdlTypes: [IDL.Text, IDL.Nat],
        returnIdlType: FileChunkResult,
        args: [fileId, chunkNumber],
      });

      if (fileResult.Err) {
        throw {
          NotKnown: `Failed to get file. Error: ${JSON.stringify(
            fileResult.Err,
          )}`,
        };
      }

      return { Ok: fileResult.Ok };
    } catch (error) {
      return { Err: handleError(error) };
    }
  }

  // Internal helper methods
  private async findOrCreateCanister(
    userId: string,
    fileSize: bigint,
  ): Promise<Principal | null> {
    let user = this.userStorage.get(userId);

    if (!user) {
      const canisterId = await this.deployCanister();
      if (!canisterId) return null;

      user = {
        userId,
        canisters: [canisterId.toText()],
        canistersMarkedFull: [],
      };

      this.userStorage.insert(userId, user);
      return canisterId;
    }
    return this.findCanisterWithFreeSpace(user, fileSize);
  }

  private async deployCanister(): Promise<Principal | null> {
    const createCanisterResult = await createCanister();
    const canisterId = createCanisterResult.canister_id;
    const wasmModule = this.wasmModule;

    if (!wasmModule) {
      throw new Error("No code found in storage at index 0");
    } else {
      // Now wasmModule is guaranteed to be a valid Uint8Array
      const wasmArray = Uint8Array.from(wasmModule);
      await installCode(canisterId, wasmArray);
    }
    return canisterId;
  }

  private async findCanisterWithFreeSpace(
    user: User,
    fileSize: bigint,
  ): Promise<Principal | null> {
    const storageLimit = 50 * 1024 * 1024 * 1024;
    const threshold = 0.95;

    for (const canisterId of user.canisters) {
      if (!user.canistersMarkedFull.includes(canisterId)) {
        const canisterPrincipal = Principal.fromText(canisterId);
        const status = await getCanisterStatus(canisterPrincipal);
        const availableStorage =
          storageLimit - bigIntToNumber(status.memory_size);

        if (availableStorage >= fileSize) {
          if (bigIntToNumber(status.cycles) < 15_000_000)
            await depositCycles(canisterPrincipal);
          return canisterPrincipal;
        }

        if (availableStorage < storageLimit * threshold)
          user.canistersMarkedFull.push(canisterId);
      }
    }

    const newCanisterId = await this.deployCanister();
    if (newCanisterId) user.canisters.push(newCanisterId.toText());

    return newCanisterId;
  }
}
