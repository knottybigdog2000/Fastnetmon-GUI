FROM node:20-alpine AS builder

WORKDIR /app

# better-sqlite3 needs build tools
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .

# Final stage
FROM node:20-alpine

WORKDIR /app

# better-sqlite3 runtime dependencies
RUN apk add --no-cache python3 make g++

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src

EXPOSE 5000

CMD ["npm", "start"]
