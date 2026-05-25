FROM node:18-alpine

WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source
COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]
