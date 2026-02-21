FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend package files
COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy backend source
COPY backend/tsconfig.json ./
COPY backend/src ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/node_modules ./node_modules/

ENV NODE_ENV=production

EXPOSE ${PORT:-3000}

CMD ["node", "dist/index.js"]
