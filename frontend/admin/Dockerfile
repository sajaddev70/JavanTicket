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
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM ${NODE_IMAGE}
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    TZ=Asia/Tehran \
    HOSTNAME=0.0.0.0 \
    PORT=3002
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3002
CMD ["node", "server.js"]
