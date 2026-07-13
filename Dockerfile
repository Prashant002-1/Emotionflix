FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci && npm --prefix server ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
