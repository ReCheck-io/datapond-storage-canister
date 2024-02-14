#!/usr/bin/env bash

set -euo pipefail

# Default values (can be overridden by command-line options)
declare facade_canister_id='facade'
declare wasm='.azle/storage/storage.wasm'
declare optimizedWasm='./.azle/storage/storage.wasm.gz'
declare service_id=''
declare network='local'
declare ic_sdk_installed=false
declare build_archive_folder='build-archives'

# Define an array of wasm files
old_wasm_files=(
  ".azle/facade/facade.wasm"
  ".azle/storage/storage.wasm"
)

# Function to display script usage
function usage() {
  echo "Usage: $0 [OPTIONS]"
  echo "Options:"
  echo "  -f, --facade-canister-id  Specify the facade canister ID (default: 'facade')"
  echo "  -w, --wasm-file           Specify the path to the compressed wasm file"
  echo "  -s, --service-id          Specify the service principle ID"
  echo "  -n, --network             Specify the DFINITY network (default: 'local' for empty or 'ic')"
  echo "  -h, --help                Display this help message"
}

# Check if dfx is installed
if command -v dfx &> /dev/null; then
  ic_sdk_installed=true
fi

# Install IC SDK if not installed
if [ "$ic_sdk_installed" = false ]; then
  echo "Error: IC SDK not installed. Please install IC SDK before running this script."
  exit 1
fi

# Parse command-line options
while [[ $# -gt 0 ]]; do
  case "$1" in
    -f|--facade-canister-id)
      facade_canister_id="$2"
      shift 2
      ;;
    -w|--wasm-file)
      wasm="$2"
      shift 2
      ;;
    -s|--service-id)
      service_id="$2"
      shift 2
      ;;
    -n|--network)
      network="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Invalid option: $1"
      usage
      exit 1
      ;;
  esac
done

# Check if service ID is provided
if [ -z "$service_id" ]; then
  echo "Error: Service ID is required. Please provide the service ID using the -s or --service-id option."
  usage
  exit 1
fi

# TODO: 1. Check if dfx is running
if ! pgrep -x "dfx" > /dev/null; then
  echo "Error: DFX is not running. Please start DFX."
  exit 1
fi

# TODO: 2. Check if there are old build wasm outputs; if yes, rename and move them to a new folder build-archives
mkdir -p "$build_archive_folder"

for old_wasm in "${old_wasm_files[@]}"; do
  if [ -e "$old_wasm" ]; then
    echo "Renaming: $old_wasm"
    base_name=$(basename "$old_wasm")
    extension="${base_name##*.}"
    file_name="${base_name%.*}"
    new_name="$build_archive_folder/$file_name-$(date +'%Y-%m-%d_%Hh-%Mm').$extension"
    echo "New Name: $new_name"
    mv "$old_wasm" "$new_name"
  else
    echo "File not found: $old_wasm"
  fi
done

# TODO: 3. Build both facade and storage canisters
echo "Building/deploying canister..."
dfx deploy --network="$network"

# TODO: 4. Run optimization command to optimize storage canister's wasm output
echo "Optimizing storage wasm output..."
gzip -f -1 "$wasm"

# TODO: 5. Load wasm output to Facade canister
echo "Loading optimized wasm output to facade..."
dfx canister call "$facade_canister_id" loadCanisterCode --argument-file <(echo "(blob \"$(hexdump -ve '1/1 "%.2x"' "$optimizedWasm" | sed 's/../\\&/g')\")")

# TODO: 6. Run initializeCanister method of Facade and pass the given Principle parameter
echo "Adding provided principal to the list of authorized services..."
dfx canister call "$facade_canister_id" initializeCanister "(principal \"$service_id\")"

# TODO: 7. Run dfx generate and generate types and copy facade types to datapond api
echo "Generating types..."
dfx generate

echo 'DataPond Storage canisters are deployed and set successfully!'
