import {
  IDL,
  StableBTreeMap,
  isController,
  caller,
  query,
  time,
  update,
} from "azle";

import { bigIntToNumber, handleError } from "./utils";
import { BoolResult, File, FileChunkResult, FilePayload } from "./types";

export default class StorageCanister {
  fileStorage = StableBTreeMap<string, File>(0);

  /**
   * Upload a file to the user's canister, either as a full file or in chunks.
   * @param file - The file data to be uploaded.
   * @param isChunked - Indicates if the file upload is in chunks.
   * @returns Result of the operation with a success indicator or error.
   */
  @update([FilePayload, IDL.Bool], BoolResult)
  uploadFile(file: FilePayload, isChunked: boolean): BoolResult {
    try {
      // Authorization check
      if (!isController(caller())) {
        throw { Unauthorized: "Unauthorized access!" };
      }

      // Retrieve any existing file with the given ID
      const existingFile = this.fileStorage.get(file.id);

      if (isChunked && existingFile) {
        // Append chunk to existing file content if file exists and isChunked is true
        const updatedContent = new Uint8Array(
          existingFile.content.length + file.content.length,
        );
        updatedContent.set(existingFile.content, 0);
        updatedContent.set(file.content, existingFile.content.length);

        const updatedFile: File = {
          ...existingFile,
          content: updatedContent,
        };

        this.fileStorage.insert(file.id, updatedFile);
      } else {
        // Insert as a new file if not chunked or if file is not already present
        const newFile: File = {
          ...file,
          createdAt: time(),
        };

        this.fileStorage.insert(file.id, newFile);
      }

      return { Ok: true };
    } catch (error) {
      return { Err: handleError(error) };
    }
  }

  /**
   * Retrieve a specific chunk of a file by its ID.
   * @param fileId - The ID of the file to retrieve.
   * @param chunkNumber - The requested chunk number.
   * @returns Result with file chunk information or error.
   */
  @query([IDL.Text, IDL.Nat], FileChunkResult)
  getFile(fileId: string, chunkNumber: bigint): FileChunkResult {
    try {
      // Authorization check
      if (!isController(caller())) {
        throw { Unauthorized: "Unauthorized access!" };
      }

      // Retrieve the file from storage
      const file = this.fileStorage.get(fileId);
      if (!file) {
        throw { NotFound: `Could not find file with given id=${fileId}` };
      }

      // Handle file chunking logic
      const fileContent = file.content;
      const maxChunkSize = 1.8 * 1024 * 1024; // 1.8 MB

      // Check if file content is smaller than the maximum chunk size
      if (fileContent.length <= maxChunkSize) {
        return {
          Ok: {
            id: file.id,
            name: file.name,
            chunk: fileContent,
            hasNext: false,
          },
        };
      }

      // Calculate offset and extract the requested chunk
      const offset = bigIntToNumber(chunkNumber) * maxChunkSize;
      const chunk = fileContent.slice(offset, offset + maxChunkSize);
      const hasNext = offset + maxChunkSize < fileContent.length;

      return {
        Ok: {
          id: file.id,
          name: file.name,
          chunk,
          hasNext,
        },
      };
    } catch (error) {
      return { Err: handleError(error) };
    }
  }
}
