# Stage 1: build
FROM node:20-alpine AS build

WORKDIR /usr/src/app

# copy package metadata first (helps with cache)
COPY package*.json ./
RUN npm ci

# copy sources
COPY tsconfig.json ./
COPY src ./src

# build
RUN npm run build

# Stage 2: production image
FROM node:20-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production
# copy dependencies
COPY package*.json ./
RUN npm ci --only=production

# copy built files from build stage
COPY --from=build /usr/src/app/dist ./dist
# optionally copy client build if you want server to serve client static files
COPY ../client/dist ./client/dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
