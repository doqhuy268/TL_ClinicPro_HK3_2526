# === 1) Install all deps (including devDependencies for build) ===
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --legacy-peer-deps

# === 2) Build Next.js app ===
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first
COPY package.json package-lock.json ./

# Copy all config files needed for build first
COPY tsconfig.json ./
COPY postcss.config.mjs ./
COPY next.config.ts ./
COPY eslint.config.mjs ./
COPY tsconfig.json ./
COPY components.json ./

# Install all dependencies (including devDependencies) for build
RUN npm ci --legacy-peer-deps

# Copy all source files (after dependencies are installed)
COPY . .

# Build arguments từ Coolify (injected automatically)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_QUEUE_SOCKET_URL
ARG NEXT_PUBLIC_RESEND_API_KEY
ARG NEXT_PUBLIC_TINYMCE_API_KEY

# Set environment variables for build
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}
ENV NEXT_PUBLIC_QUEUE_SOCKET_URL=${NEXT_PUBLIC_QUEUE_SOCKET_URL}
ENV NEXT_PUBLIC_RESEND_API_KEY=${NEXT_PUBLIC_RESEND_API_KEY}
ENV NEXT_PUBLIC_TINYMCE_API_KEY=${NEXT_PUBLIC_TINYMCE_API_KEY}

RUN npm run build

# === 3) Production deps only ===
FROM node:20-alpine AS prod-deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --production --legacy-peer-deps --ignore-scripts

# === 4) Runtime image ===
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_RUNTIME=nodejs
ENV NEXT_SERVER_RESPONSE_TIMEOUT=180000

# Runtime environment variables từ Coolify (injected automatically)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_QUEUE_SOCKET_URL
ARG NEXT_PUBLIC_RESEND_API_KEY
ARG NEXT_PUBLIC_TINYMCE_API_KEY
 
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}
ENV NEXT_PUBLIC_QUEUE_SOCKET_URL=${NEXT_PUBLIC_QUEUE_SOCKET_URL}
ENV NEXT_PUBLIC_RESEND_API_KEY=${NEXT_PUBLIC_RESEND_API_KEY}
ENV NEXT_PUBLIC_TINYMCE_API_KEY=${NEXT_PUBLIC_TINYMCE_API_KEY}

# Production node_modules
COPY --from=prod-deps /app/node_modules ./node_modules

# Next.js build artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# App config files
COPY package.json package-lock.json ./
COPY next.config.ts ./

EXPOSE 3000

CMD ["npm", "start"]