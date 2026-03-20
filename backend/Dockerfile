# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# better-sqlite3 needs build tools for compilation
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

# Production stage
FROM node:20-alpine

WORKDIR /app

# We need some base libs for better-sqlite3 but usually don't need the full build chain in final
# However, better-sqlite3 is a native addon, so it needs to be pre-built in builder
RUN apk add --no-cache libstdc++

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src

# Create a data directory for the SQLite database
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["npm", "start"]
