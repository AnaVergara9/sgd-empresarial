FROM node:22-alpine AS build
WORKDIR /app
COPY local-module ./local-module
WORKDIR /app/frontends/mf-chat
COPY frontends/mf-chat/package*.json ./
RUN npm ci
COPY frontends/mf-chat/ ./
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

FROM nginx:alpine
COPY frontends/mf-chat/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontends/mf-chat/dist /usr/share/nginx/html
EXPOSE 80
