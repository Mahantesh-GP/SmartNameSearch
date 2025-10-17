FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
# Use npm install when package-lock.json may not be present; ensure legacy peer deps for compatibility
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
