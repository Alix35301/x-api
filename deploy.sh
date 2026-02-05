#!/bin/bash
set -e

IMAGE_NAME="expense-tracker-api"
REGISTRY="registry.ali6ssan.net"
REMOTE_USER="ubuntu"
REMOTE_HOST="192.168.18.69"
CONTAINER_NAME="exp_api"
ENV_FILE=".env.production"

FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}"
TAG="${1:-latest}"
TAGGED_IMAGE="${FULL_IMAGE}:${TAG}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: ${ENV_FILE} not found. Create it with your production values first."
  exit 1
fi

echo "==> Building production image..."
docker build -f Dockerfile.prod --build-arg ENV_FILE="$ENV_FILE" -t "$TAGGED_IMAGE" .

echo "==> Pushing to registry..."
docker push "$TAGGED_IMAGE"

echo "==> Deploying to server..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" bash -s -- "$TAGGED_IMAGE" "$CONTAINER_NAME" <<'EOF'
  set -e
  TAGGED_IMAGE="$1"
  CONTAINER_NAME="$2"

  echo "==> Pulling image..."
  docker pull "$TAGGED_IMAGE"

  echo "==> Stopping old container..."
  docker stop "$CONTAINER_NAME" 2>/dev/null || true
  docker rm "$CONTAINER_NAME" 2>/dev/null || true

  echo "==> Ensuring traefik network exists..."
  docker network create traefik-proxy 2>/dev/null || true

  echo "==> Running migrations..."
  docker run --rm \
    --network traefik-proxy \
    "$TAGGED_IMAGE" \
    pnpm run migration:run

  echo "==> Starting new container..."
  docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    --network traefik-proxy \
    --label 'traefik.docker.network=traefik-proxy' \
    --label 'traefik.enable=true' \
    --label 'traefik.http.routers.expense-api.rule=Host(`expense-api.ali6ssan.net`)' \
    --label 'traefik.http.routers.expense-api.tls=true' \
    --label 'traefik.http.routers.expense-api.tls.certresolver=letsencrypt' \
    --label 'traefik.http.routers.expense-api.entrypoints=websecure' \
    --label 'traefik.http.services.expense-api.loadbalancer.server.port=3000' \
    "$TAGGED_IMAGE"

  echo "==> Done! Container status:"
  docker ps --filter name="$CONTAINER_NAME"
EOF

echo "==> Deployment complete!"
