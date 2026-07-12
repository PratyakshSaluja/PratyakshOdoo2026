FROM node:20-alpine

WORKDIR /app


COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

COPY . .

RUN npm run setup
RUN SESSION_SECRET=dummy npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]