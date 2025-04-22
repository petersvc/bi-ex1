FROM node:23-bookworm-slim

WORKDIR /app

COPY . .

RUN npm i -g bun && \
    bun install && \
    chown -R 1000:1000 /app /usr/bin /usr/local/bin

USER 1000

CMD [ "sleep", "infinity" ]
