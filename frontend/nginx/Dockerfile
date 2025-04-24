# Use the official Nginx image
FROM nginx:latest

# Copy the custom configuration file into the Nginx default config location
COPY default.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (the port Nginx listens on inside the container)
EXPOSE 80