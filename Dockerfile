FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
ARG APP_REVISION=development
RUN node -e 'require("fs").writeFileSync("dist/version.json", JSON.stringify({revision:process.env.APP_REVISION}))'

FROM nginxinc/nginx-unprivileged:stable-alpine AS runner
ARG APP_REVISION=development
LABEL org.opencontainers.image.source="https://github.com/cedrugs/interactive-portfolio"
LABEL org.opencontainers.image.revision=$APP_REVISION
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:3000/healthz || exit 1
