import {
  Canister,
  Err,
  Ok,
  Principal,
  Result,
  StableBTreeMap,
  bool,
  ic,
  text,
  update,
} from "azle";

import { Error, File, FileResponse } from "./types";

const fileStorage = StableBTreeMap(text, File, 0);

export default Canister({
  /**
   * Function to handle file uploads to the user's canister.
   * @param canisterId - The Principal ID of the user's canister.
   * @param file - The file data.
   * @param isChunked - Boolean indicating whether the file upload is chunked.
   * @returns Result indicating success or an error.
   */
  uploadFile: update(
    [Principal, File, bool],
    Result(FileResponse, Error),
    (canisterId, file, isChunked) => {
      if (!ic.caller().compareTo(canisterId)) {
        return Err({ Unauthorized: "Unauthorized access!" });
      }

      const existingFile = fileStorage.get(file.id);

      if (isChunked && existingFile) {
        // If chunks exist for this file, append the new chunk
        const updateFile: typeof File = {
          ...existingFile,
          content: existingFile.content.concat(file.content),
        };

        fileStorage.insert(file.id, updateFile);
      } else {
        // Store the file in the user's canister storage
        const newFile: typeof File = {
          ...file,
          createdAt: ic.time(),
        };

        fileStorage.insert(file.id, newFile);
      }

      return Ok({
        canisterId: ic.id(),
        id: file.id,
        name: file.name,
      });
    },
  ),

  /**
   * Function to handle getting files.
   * @param canisterId - The Principal ID of the user's canister.
   * @param fileId - The file ID.
   * @returns Result file or an error.
   */
  getFile: update(
    [Principal, text],
    Result(File, Error),
    (canisterId, fileId) => {
      if (!ic.caller().compareTo(canisterId)) {
        return Err({ Unauthorized: "Unauthorized access!" });
      }

      const file = fileStorage.get(fileId);

      if (!file || "None" in file) {
        return Err({ NotFound: `Could not find file with given id=${fileId}` });
      }

      return Ok(file.Some);
    },
  ),
});
