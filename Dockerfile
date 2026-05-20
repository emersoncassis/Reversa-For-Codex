FROM node:22.21.1-slim AS build

WORKDIR /app/reversa-app-sdk

COPY reversa-app-sdk/package*.json ./
RUN npm ci

COPY reversa-app-sdk/tsconfig.json ./
COPY reversa-app-sdk/src ./src
RUN npm run build

FROM node:22.21.1-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app/reversa-app-sdk

COPY reversa-app-sdk/package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/reversa-app-sdk/dist ./dist
COPY reversa-app-sdk/public ./public
COPY reversa-app-sdk/submission ./submission

EXPOSE 8787

CMD ["npm", "run", "start:prod"]
