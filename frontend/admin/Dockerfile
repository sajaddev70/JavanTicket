# Base images come from the ParsPack Docker mirror and npm packages from the ParsPack npm mirror,
# so the image builds on Iranian servers.
ARG REGISTRY=docker.abrha.net
ARG NODE_IMAGE=${REGISTRY}/node:22-alpine

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
ARG NPM_REGISTRY=https://mirror.abrha.net/repository/npm/
COPY package.json package-lock.json ./
RUN npm config set registry ${NPM_REGISTRY} \
    && npm ci --no-audit --no-fund

FROM ${NODE_IMAGE} AS build
WORKDIR /app
# NEXT_PUBLIC_* values are inlined into the browser bundle at build time.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_USER_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
# Server-side data fetches during `next build` must not depend on the live API: it is not running yet on a first
# deploy, and the public domain may still point at another server. A closed local port fails instantly, the pages
# fall back to defaults, and ISR refreshes them from API_INTERNAL_URL (the backend container) at runtime.
ARG BUILD_API_URL=http://127.0.0.1:9/api/v1
ENV API_INTERNAL_URL=${BUILD_API_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM ${NODE_IMAGE}
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    TZ=Asia/Tehran \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
