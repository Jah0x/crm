# Use Node 20 for building the project
FROM node:20-alpine as builder

WORKDIR /app

# Copy only package files and scripts initially
COPY package.json package-lock.json* ./
COPY scripts ./scripts

# Install dependencies (runs preinstall)
RUN npm install

# Copy remaining project files
COPY tsconfig.json vite.config.ts index.html ./
COPY prisma ./prisma
COPY src ./src

# Build artifacts
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
