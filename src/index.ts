import {
  IDL,
  StableBTreeMap,
  caller,
  query,
  update,
  time,
  Principal,
  id,
  isController,
  call,
} from "azle";
import {
  CanisterStatusArgs,
  CanisterStatusResult,
} from "azle/canisters/management";

import {
  Service,
  FilePayload,
  ServiceResult,
  StoredFileMeta,
  FileChunkResult,
  FileUploadResult,
} from "./types";
import { bigIntToNumber, handleError, Uint8ArraySerializer } from "./utils";

export default class StorageCanister {
  private fileStorage = StableBTreeMap<string, StoredFileMeta>(0);
  private serviceStorage = StableBTreeMap<Principal, Service>(1);
  private chunkStorage = StableBTreeMap<string, Uint8Array>(
    2,
    undefined,
    Uint8ArraySerializer,
  );

  @update([IDL.Principal], ServiceResult)
  initializeCanister(serviceId: Principal): ServiceResult {
    try {
      if (!isController(caller())) {
        throw { Unauthorized: "Unauthorized access!" };
      }

      if (this.serviceStorage.containsKey(serviceId)) {
        throw { Conflict: "Service already exists!" };
      }

      const newService = {
        id: serviceId,
        createdAt: time(),
      };
      this.serviceStorage.insert(serviceId, newService);

      return { Ok: newService };
    } catch (error) {
      return { Err: handleError(error) };
    }
  }

  @update([FilePayload, IDL.Text], FileUploadResult)
  async uploadFile(
    file: FilePayload,
    userId: string,
  ): Promise<FileUploadResult> {
    try {
      if (!this.serviceStorage.containsKey(caller())) {
        throw { Unauthorized: "Unauthorized access!" };
      }

      let storedFile = this.fileStorage.get(file.id);

      if (!storedFile) {
        storedFile = {
          id: file.id,
          name: file.name,
          size: file.size,
          chunks: [],
          createdAt: time(),
          userId,
        };
        this.fileStorage.insert(file.id, storedFile);
      }

      const chunkKey = `${file.id}_chunk_${storedFile.chunks.length}`;
      this.chunkStorage.insert(chunkKey, file.content);

      storedFile.chunks.push(chunkKey);
      this.fileStorage.insert(file.id, storedFile);

      return {
        Ok: {
          id: file.id,
          name: file.name,
          canisterId: id().toText(),
        },
      };
    } catch (error) {
      return { Err: handleError(error) };
    }
  }

  @query([IDL.Text, IDL.Nat], FileChunkResult)
  getFile(fileId: string, chunkNumber: bigint): FileChunkResult {
    try {
      if (!this.serviceStorage.containsKey(caller())) {
        throw { Unauthorized: "Unauthorized access!" };
      }

      const file = this.fileStorage.get(fileId);
      if (!file) {
        throw { NotFound: `File with ID ${fileId} not found.` };
      }

      const chunkIndex = Number(chunkNumber);
      if (chunkIndex < 0 || chunkIndex >= file.chunks.length) {
        throw { NotFound: `Chunk ${chunkIndex} not found for file ${fileId}.` };
      }

      const chunkKey = file.chunks[chunkIndex];
      const chunk = this.chunkStorage.get(chunkKey);
      if (!chunk) {
        throw { NotFound: `Chunk not found for key ${chunkKey}.` };
      }

      const hasNext = chunkIndex < file.chunks.length - 1;

      return {
        Ok: {
          id: fileId,
          name: file.name,
          chunk: chunk,
          hasNext: hasNext,
        },
      };
    } catch (error) {
      return { Err: handleError(error) };
    }
  }

  @update([IDL.Nat], IDL.Bool)
  async checkCanisterFreeSpace(fileSize: bigint): Promise<boolean> {
    try {
      // Call management canister to get canister status
      const status = await call("aaaaa-aa", "canister_status", {
        paramIdlTypes: [CanisterStatusArgs],
        returnIdlType: CanisterStatusResult,
        args: [{ canister_id: id() }],
      });

      if (!status || !status.memory_size) {
        throw new Error("Unable to retrieve canister status or memory size.");
      }

      // Updated storage limit: 90 GiB (90 * 1024 * 1024 * 1024 bytes)
      const storageLimit = 90 * 1024 * 1024 * 1024;
      const threshold = 0.9; // 90% usage allowed

      const maxUsableStorage = storageLimit * threshold;
      const usedStorage = bigIntToNumber(status.memory_size);
      const availableStorage = maxUsableStorage - usedStorage;

      return availableStorage >= bigIntToNumber(fileSize);
    } catch (error) {
      console.error("Error checking free space:", error);
      return false; // Default to false in case of error
    }
  }
}
