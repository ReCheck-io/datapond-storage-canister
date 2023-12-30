#!/usr/bin/env bash

set -euo pipefail

# Default values (can be overridden by command-line options)
declare facade_canister_id='facade'
declare wasm='./.azle/storage/storage.wasm.gz'
declare service_id=''
declare network=''

# Function to display script usage
function usage() {
  echo "Usage: $0 [OPTIONS]"
  echo "Options:"
  echo "  -f, --facade-canister-id  Specify the facade canister ID (default: '$facade_canister_id')"
  echo "  -w, --wasm-file           Specify the path to the compressed wasm file (default: '$wasm')"
  echo "  -s, --service-id          Specify the service principle ID"
  echo "  -n, --network             Specify the DFINITY network"
  echo "  -h, --help                Display this help message"
}

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

# TODO: 2. Build both facade and storage canisters
dfx deploy

# TODO: 3. Run optimization command to optimize storage canister's wasm output
gzip -f -1 .azle/storage/storage.wasm

# TODO: 5. Load wasm output to Facade canister
dfx canister call "$facade_canister_id" loadCanisterCode --argument-file <(echo "(blob \"$(hexdump -ve '1/1 "%.2x"' "$wasm" | sed 's/../\\&/g')\")")

# TODO: 6. Run initializeCanister method of Facade and pass the given Principle parameter
dfx canister call "$facade_canister_id" initializeCanister "(principal \"$service_id\")"
