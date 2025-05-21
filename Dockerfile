
FROM mcr.microsoft.com/playwright:v1.43.1-jammy

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

RUN npx playwright install --with-deps

COPY . .

RUN yarn build

EXPOSE 3000

CMD ["node", "dist/index.js"]
