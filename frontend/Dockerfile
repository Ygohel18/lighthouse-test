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
# This generates the .next directory
RUN npm run build

# Stage 2: Runner
FROM node:20-slim as runner

WORKDIR /app

# Copy necessary files from the builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Set environment variables for the Next.js app
# NEXT_PUBLIC_API_BASE_URL will be set in docker-compose.yml
# EXPOSE the port the Next.js server runs on (default 3000)
EXPOSE 3000

# Command to start the Next.js production server
CMD ["npm", "start"]