#!/usr/bin/env bash

set -euo pipefail

# Default values (can be overridden by command-line options)
declare canister_id='storage'
declare service_id=''
declare network='local'
declare ic_sdk_installed=false

# Function to display script usage
function usage() {
  echo "Usage: $0 [OPTIONS]"
  echo "Options:"
  echo "  -f, --facade-canister-id  Specify the facade canister ID (default: 'facade')"
  echo "  -w, --wasm-file           Specify the path to the compressed wasm file"
  echo "  -s, --service-id          Specify the service principal ID"
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
    -f|--canister-id)
      canister_id="$2"
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

# Check if DFX is running
if ! pgrep -x "dfx" > /dev/null; then
  echo "Error: DFX is not running. Please start DFX."
  exit 1
fi

# Build and deploy facade canisters
echo "Building/deploying canister..."
dfx deploy --network="$network" "$canister_id"

# Run initializeCanister method of Facade and pass the given Principle parameter
echo "Adding provided principal to the list of authorized services..."
dfx canister --network="$network" call "$canister_id" initializeCanister "(principal \"$service_id\")"

echo 'DataPond Storage canister is deployed and set successfully!'
