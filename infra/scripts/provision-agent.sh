#!/bin/bash
# ─── Provision Agent Container for a User ────────────────────────────────────
# Usage: ./provision-agent.sh <user-id>
#
# In production this would be called by the API's agentProvisioner service.
# This script is useful for manual provisioning and debugging.

set -euo pipefail

USER_ID="${1:?Usage: $0 <user-id>}"
CONTAINER_NAME="pai-agent-${USER_ID}"
IMAGE="${AGENT_CONTAINER_IMAGE:-pai/agent:latest}"

echo "Provisioning agent for user: $USER_ID"

# Stop and remove if already running (idempotent)
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Removing existing container: $CONTAINER_NAME"
  docker rm -f "$CONTAINER_NAME"
fi

docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  --memory 512m \
  --cpus 0.5 \
  --network pai-network \
  -e "USER_ID=${USER_ID}" \
  -e "ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}" \
  -e "REDIS_URL=${REDIS_URL}" \
  -e "SUPABASE_URL=${SUPABASE_URL}" \
  -e "SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}" \
  "$IMAGE"

echo "Agent container started: $CONTAINER_NAME"
docker ps --filter "name=$CONTAINER_NAME" --format "table {{.ID}}\t{{.Status}}\t{{.Names}}"
