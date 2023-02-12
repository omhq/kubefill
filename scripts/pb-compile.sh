#!/usr/bin/env sh

"""
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    reposerver/reposervice.proto
"""

REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
PB_PATH="${REPO_ROOT}/reposerver"
PROTO_FILE=${1:-"reposervice.proto"}


echo "Generating pb files for ${PROTO_FILE} service"
protoc \
    --proto_path="${PB_PATH}" \
    --go_out="${PB_PATH}" \
    --go_opt=paths=source_relative \
    --go-grpc_out="${PB_PATH}" \
    --go-grpc_opt=paths=source_relative "${PB_PATH}"/"${PROTO_FILE}"
