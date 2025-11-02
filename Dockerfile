FROM node:22-alpine AS base

LABEL org.opencontainers.image.source="https://github.com/Navatusein/Light-Control-Dashboard"

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM base AS runner
WORKDIR /app

RUN apk add --no-cache bash su-exec
RUN apk add --update tini

ENV NODE_ENV=production

ENV PORT=80
ENV HOSTNAME="0.0.0.0"

ENV USER=nextjs
ENV GROUP=nodejs

ENV GID=1001
ENV UID=1001

RUN addgroup --system --gid ${GID} nodejs
RUN adduser --system --uid ${UID} nextjs

COPY --from=builder --chown=${USER}:${GROUP} /app/public ./public
COPY --from=builder --chown=${USER}:${GROUP} /app/.next/standalone ./
COPY --from=builder --chown=${USER}:${GROUP} /app/.next/static ./.next/static

RUN mkdir -p /app/public/files && \
    chown ${USER}:${GROUP} /app/public/files

VOLUME /app/public/files

COPY entrypoint.sh /entrypoint.sh

EXPOSE ${PORT}

ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]