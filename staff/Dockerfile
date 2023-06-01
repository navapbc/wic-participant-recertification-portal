# -------- Image: base -------- #
# Base node image with package updates and dependencies
FROM node:18-slim as base
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  # Install for healthcheck
  wget jq
# Set working directory and node user
WORKDIR /home/node/lowdefy

# -------- Image: deps -------- #
# Install all node_modules, including dev dependencies
FROM base as deps
COPY --chown=node:node package.json package-lock.json ./
RUN npm install

# -------- Image: dev -------- #
# Provide a development image
FROM base as dev
COPY --from=deps /home/node/lowdefy/node_modules ./node_modules
COPY --chown=node:node  . .
CMD ["npx", "lowdefy@3.23.3", "dev"]

# -------- Image: build -------- #
# Build the Lowdefy config using the Lowdefy CLI
FROM base as build
COPY --from=deps /home/node/lowdefy/node_modules ./node_modules
COPY --chown=node:node  . .
RUN npx lowdefy@3.23.3 build

# -------- Image: production-deps -------- #
# Setup production node_modules
FROM base as production-deps
ENV NODE_ENV production
COPY --from=deps /home/node/lowdefy/node_modules ./node_modules
COPY --chown=node:node package.json package-lock.json ./
RUN npm prune --production

# -------- Image: prod -------- #
# Finally, build the production image with minimal footprint
FROM lowdefy/lowdefy:3.23.3 as prod
ENV npm_config_cache /tmp
USER node
COPY --from=production-deps /home/node/lowdefy/node_modules ./node_modules
COPY --from=build --chown=node:node /home/node/lowdefy/.lowdefy/build ./build
COPY --chown=node:node ./public ./public
CMD ["node", "./dist/server.js"]

# -------- Image: Lambda ------ #
# ... the prod image won't work in lambdas

# Use the correct Lowdefy base image
FROM lowdefy/lowdefy-aws-lambda:3.23.3 as lambda
COPY --from=production-deps /home/node/lowdefy/node_modules ./node_modules
COPY --from=build --chown=node:node /home/node/lowdefy/.lowdefy/build ./build
COPY --chown=node:node ./public ./public
COPY bin/entrypoint.js ./
ENTRYPOINT [ "node", "./entrypoint.js" ]
CMD [ "/lambda-entrypoint.sh", "dist/server.handler"]
