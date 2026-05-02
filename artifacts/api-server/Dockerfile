FROM node:22-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile --prod

COPY dist/ ./dist/

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
