FROM node:23-bookworm-slim

WORKDIR /app

COPY . .

RUN bash -c "apt update && npm i -g bun && bun install"

CMD [ "sleep", "infinity" ]