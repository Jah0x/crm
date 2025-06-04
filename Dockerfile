# Use Node 20 for building the project
FROM node:20-alpine as builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* tsconfig.json vite.config.ts ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src

RUN npm install
RUN npm run prisma:generate
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--port", "5173", "--host"]
