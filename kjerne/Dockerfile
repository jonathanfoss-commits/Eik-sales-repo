# Plattformkjernen. Én Node-prosess, ingen byggesteg.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY app ./app
COPY tenants ./tenants
EXPOSE 3000
# start.js migrerer og oppretter tenants (TENANTS=...) før serveren starter
CMD ["node", "server/start.js"]
