FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p public/uploads/perfis

EXPOSE 3002

CMD ["node", "bin/www"]