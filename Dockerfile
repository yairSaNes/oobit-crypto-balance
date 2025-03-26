# Base image for all stages
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
# RUN apk add --update --no-cache python3 alpine-sdk
# RUN apk-get update
# RUN apk-get install -y build-essential
# RUN apk-get install -y python
# RUN npm install --no-bin-links
RUN npm install
COPY . .

##############################
# Build for balance service
##############################
FROM base AS builder-balance
RUN npm run build:balance

##############################
# Build for rate service
##############################
FROM base AS builder-rate
RUN npm run build:rate

##############################
# Runtime for balance service
##############################
FROM builder-balance AS runner-balance
WORKDIR /app
COPY package*.json ./
COPY --from=builder-balance /app/node_modules ./node_modules
COPY --from=builder-balance /app/dist/apps/balance ./dist
EXPOSE 3001
CMD ["node", "dist/main"]  # Adjust if entry point is not dist/main.js

##############################
# Runtime for rate service
##############################
FROM builder-rate AS runner-rate
WORKDIR /app
COPY package*.json ./
COPY --from=builder-rate /app/node_modules ./node_modules
COPY --from=builder-rate /app/dist/apps/rate ./dist
EXPOSE 3002
CMD ["node", "dist/main"]  # Adjust if entry point is not dist/main.js