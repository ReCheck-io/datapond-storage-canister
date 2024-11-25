# Datapond Storage

## Setup

1. Install DFINITY SDK using the following command:
```bash
  DFX_VERSION=0.22.0 sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
```

2. Add DFINITY to your PATH variables by appending the following line to your `.bashrc`:
```bash
  echo 'export PATH="$PATH:$HOME/bin"' >> "$HOME/.bashrc"
```

3. Start the DFINITY local environment in the background:
```bash
  dfx start --background
```

4. Install project dependencies:
```bash
  npm install
```

5. Make the deployment script executable:
```bash
  chmod +x ./deploy.sh
```

6. Run the deployment script to build, deploy, and initialize canisters:
```bash
  ./deploy.sh --service-id '<YOUR_PRINCIPLE_HERE>'
```

Note: This process may take some time.

## Methods

#### **Outer Layer Canister**

1. **`getStatus`**
   - **Description:** Retrieves the current status of the canister, including memory and cycles usage.
   - **Returns:** A `CanisterStatusResult` containing the status or an error.

2. **`initializeCanister`**
   - **Description:** Initializes the canister with an authorized service ID. Only the controller can execute this.
   - **Parameters:**  
     - `serviceId` (`Principal`) – The identifier of the service.
   - **Returns:** A `ServiceResult` with the service data or an error.

3. **`loadCanisterCode`**
   - **Description:** Loads Wasm code into the canister for deploying new canisters.
   - **Parameters:**  
     - `blobData` (`Uint8Array`) – The binary data of the Wasm code.
   - **Returns:** A `BoolResult` indicating success or error.

4. **`uploadFile`**
   - **Description:** Manages the upload of a file to a user's storage canister.
   - **Parameters:**  
     - `file` (`FilePayload`) – The file data to upload.
     - `userId` (`Text`) – Identifier of the user uploading the file.
     - `isChunked` (`Bool`) – Indicates if the file is being uploaded in chunks.
   - **Returns:** A `FileResult` with file information or an error.

5. **`getFile`**
   - **Description:** Retrieves a specific chunk of a file from a user's storage canister.
   - **Parameters:**  
     - `userId` (`Text`) – Identifier of the user.
     - `fileId` (`Text`) – Identifier of the file.
     - `canisterId` (`Text`) – ID of the target storage canister.
     - `chunkNumber` (`Nat`) – The chunk number to retrieve.
   - **Returns:** A `FileChunkResult` containing the file chunk or an error.

---

#### **Inner Layer Storage Canister**

1. **`uploadFile`**
   - **Description:** Handles file uploads to the storage canister. Supports both full-file and chunked uploads.
   - **Parameters:**  
     - `file` (`FilePayload`) – File metadata and content.
     - `isChunked` (`Bool`) – Whether the file is uploaded in chunks.
   - **Returns:** A `BoolResult` indicating success or failure.

2. **`getFile`**
   - **Description:** Retrieves a chunk of a file by its ID.
   - **Parameters:**  
     - `fileId` (`Text`) – The file's unique identifier.
     - `chunkNumber` (`Nat`) – The chunk number to retrieve.
   - **Returns:** A `FileChunkResult` with the file chunk and metadata or an error.

---

### **Internal Helper Methods**

1. **`findOrCreateCanister`**
   - **Description:** Finds an existing canister with enough storage or deploys a new one for the user.
   - **Parameters:**  
     - `userId` (`Text`) – The user for whom the canister is being found/created.
     - `fileSize` (`bigint`) – The size of the file to upload.
   - **Returns:** A `Principal` of the canister or `null` if none are available.

2. **`deployCanister`**
   - **Description:** Deploys a new storage canister using the stored Wasm code.
   - **Returns:** The `Principal` of the newly deployed canister or throws an error.

3. **`findCanisterWithFreeSpace`**
   - **Description:** Searches a user's existing canisters for one with sufficient storage space.
   - **Parameters:**  
     - `user` (`User`) – The user object with canister references.
     - `fileSize` (`bigint`) – The size of the file to upload.
   - **Returns:** A `Principal` of a canister with available storage or deploys a new one.
