# Frontend (React, Create React App). En desarrollo, compose.yaml monta el código y usa npm start.
FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV BROWSER=none \
    HOST=0.0.0.0 \
    PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
