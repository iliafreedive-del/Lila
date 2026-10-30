FROM node:22-alpine
WORKDIR /app
COPY server.js package.json ./
ENV DATA_FILE=/data/data.json
VOLUME /data
EXPOSE 8080
CMD ["node", "server.js"]
