FROM nginx:alpine
# replace default with frontend server block
COPY frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
