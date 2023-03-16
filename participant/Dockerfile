# -------- Image: base -------- #
# Base node image with package updates and dependencies
FROM node:18-slim as base
# Install openssl for Prisma
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
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
COPY --chown=node:node prisma .
RUN npx prisma generate
COPY --chown=node:node . .
CMD ["npm", "run", "dev:docker"]

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
