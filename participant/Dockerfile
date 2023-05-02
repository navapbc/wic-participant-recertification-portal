# -------- Image: base -------- #
# Base node image with package updates and dependencies
# Use alpine to force using openssl@3 for prisma segfault issue
# See https://github.com/prisma/prisma/issues/10649#issuecomment-1430379940
FROM node:18-alpine as base
RUN apk update \
  && apk upgrade \
  && apk add --no-cache \
  # Install curl for healthcheck
  curl \
  # Install openssl for Prisma
  openssl
# Set working directory and node user
WORKDIR /home/node/remix

# -------- Image: deps -------- #
# Install all node_modules, including dev dependencies
FROM base as deps
COPY --chown=node:node package.json package-lock.json ./
RUN npm install --production=false

# -------- Image: dev -------- #
# Provide a development image
FROM base as dev
COPY --from=deps /home/node/remix/node_modules ./node_modules
COPY --chown=node:node prisma prisma
RUN npx prisma generate
COPY --chown=node:node . .
RUN cp public/data/submissions.not-prod.json public/data/submissions.json
CMD ["npm", "run", "dev:docker"]

# -------- Image: e2e -------- #
# Provide an e2e image
FROM dev as e2e
ENTRYPOINT ["./entrypoint-e2e.sh"]
RUN npm run css
RUN npm run build
CMD ["npm", "run", "serve"]

# -------- Image: build -------- #
# Build the app
FROM base as build
COPY --from=deps /home/node/remix/node_modules ./node_modules
COPY --chown=node:node prisma .
RUN npx prisma generate
COPY --chown=node:node . .
RUN npm run css
RUN npm run build

# -------- Image: production-deps -------- #
# Setup production node_modules
FROM base as production-deps
ENV NODE_ENV production
COPY --from=deps /home/node/remix/node_modules ./node_modules
COPY --chown=node:node package.json package-lock.json ./
RUN npm prune --production

# -------- Image: prod -------- #
# Finally, build the production image with minimal footprint
FROM base as prod
ENV NODE_ENV production
ENV npm_config_cache /tmp
USER node
COPY --from=production-deps /home/node/remix/node_modules ./node_modules
COPY --from=build /home/node/remix/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /home/node/remix/build ./build
COPY --from=build /home/node/remix/public/build ./public/build
COPY --chown=node:node . .
VOLUME ["/tmp"]
CMD ["/home/node/remix/bin/prod-start.sh"]

# -------- Image: lower-envs -------- #
# Build a production-like image with non-prod seed data
FROM prod as lower-envs
RUN cp public/data/submissions.not-prod.json public/data/submissions.json
