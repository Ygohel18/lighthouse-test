# Stage 1: Builder
FROM node:20-slim as builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Runner
FROM node:20-slim as runner

WORKDIR /app

# Copy necessary files from the builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Force Next.js to listen on all interfaces (0.0.0.0)
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Start Next.js production server
# Next.js 15+ uses HOSTNAME env var to bind to 0.0.0.0
CMD ["npm", "run", "start"]
