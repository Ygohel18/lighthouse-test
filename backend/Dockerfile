# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
# to leverage Docker cache. A change in source code won't
# trigger a re-install of dependencies if package.json hasn't changed.
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the port the app runs on (default 3000 for the API)
# This is just documentation, doesn't actually publish the port
EXPOSE 3000

# The command to run the application is defined in docker-compose.yml
# CMD ["node", "dist/index.js"] # Example, but overridden in compose