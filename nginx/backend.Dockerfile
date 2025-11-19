FROM nginx:alpine
# replace default with backend server block
COPY backend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
