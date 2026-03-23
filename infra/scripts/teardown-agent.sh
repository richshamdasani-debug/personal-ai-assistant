#!/bin/bash
# ─── Teardown Agent Container for a User ─────────────────────────────────────
# Usage: ./teardown-agent.sh <user-id>
# WARNING: This permanently removes the container. Use suspend for temporary stops.

set -euo pipefail

USER_ID="${1:?Usage: $0 <user-id>}"
CONTAINER_NAME="pai-agent-${USER_ID}"

echo "Tearing down agent for user: $USER_ID"

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  docker rm -f "$CONTAINER_NAME"
  echo "Container removed: $CONTAINER_NAME"
else
  echo "No container found for: $CONTAINER_NAME"
fi
