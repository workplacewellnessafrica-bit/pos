# syntax=docker/dockerfile:1.4
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ----------------------------------------
# 1. Monorepo Base Setup
# ----------------------------------------
FROM base AS builder
WORKDIR /app
COPY . .
RUN --mount=type=cache,target=/pnpm/store pnpm install --frozen-lockfile

# Generate Prisma and Build everything
RUN pnpm run build

# ----------------------------------------
# 2. Setup API Image
# ----------------------------------------
FROM base AS api
WORKDIR /app
COPY --from=builder /app /app
ENV NODE_ENV=production
EXPOSE 4000
CMD ["pnpm", "--filter", "@dukapos/api", "start"]

# ----------------------------------------
# 3. Setup Web Admin (Nginx)
# ----------------------------------------
FROM nginx:alpine AS admin
COPY --from=builder /app/apps/web-admin/dist /usr/share/nginx/html
# SPA Routing configuration
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ----------------------------------------
# 4. Setup Marketing (NextJS)
# ----------------------------------------
FROM base AS marketing
WORKDIR /app
COPY --from=builder /app /app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "--filter", "@dukapos/web-marketing", "start"]
