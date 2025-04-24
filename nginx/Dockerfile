# Use the official Nginx image
FROM nginx:latest

# Remove the default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy all custom configuration files from the build context's nginx directory
# This will copy backend.conf and frontend.conf
COPY ./nginx/*.conf /etc/nginx/conf.d/

# Expose port 80 (the port Nginx listens on inside the container)
EXPOSE 80