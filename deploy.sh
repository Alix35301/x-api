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
ssh "${REMOTE_USER}@${REMOTE_HOST}" bash -s <<EOF
  set -e

  echo "==> Pulling image..."
  docker pull ${TAGGED_IMAGE}

  echo "==> Stopping old container..."
  docker stop ${CONTAINER_NAME} 2>/dev/null || true
  docker rm ${CONTAINER_NAME} 2>/dev/null || true

  echo "==> Starting new container..."
  docker run -d \
    --name ${CONTAINER_NAME} \
    --restart unless-stopped \
    --network host \
    -p 3000:3000 \
    ${TAGGED_IMAGE}

  echo "==> Done! Container status:"
  docker ps --filter name=${CONTAINER_NAME}
EOF

echo "==> Deployment complete!"
