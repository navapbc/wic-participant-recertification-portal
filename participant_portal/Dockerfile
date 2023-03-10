# -------- Image: base -------- #
# Base node image with package updates and dependencies
FROM node:18-slim as base
# Install openssl for Prisma
WORKDIR /srv
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  openssl

# -------- Image: deps -------- #
# Install all node_modules, including dev dependencies
FROM base as deps
COPY package.json package-lock.json ./
RUN npm install --production=false

# -------- Image: dev -------- #
# Provide a development image
FROM base as dev
COPY --from=deps /srv/node_modules /srv/node_modules
COPY prisma .
RUN npx prisma generate
COPY . .
CMD ["npm", "run", "dev:docker"]

# -------- Image: build -------- #
# Build the app
FROM base as build
COPY --from=deps /srv/node_modules /srv/node_modules
COPY prisma .
RUN npx prisma generate
COPY . .
RUN npm run build
RUN npm run css

# -------- Image: test -------- #
# Provide a test image
FROM build as test
ENV NODE_ENV test
CMD ["npm", "test"]

# -------- Image: production-deps -------- #
# Setup production node_modules
FROM base as production-deps
ENV NODE_ENV production
COPY --from=deps /srv/node_modules /srv/node_modules
COPY package.json package-lock.json ./
RUN npm prune --production

# -------- Image: prod -------- #
# Finally, build the production image with minimal footprint
FROM base as prod
ENV NODE_ENV production
COPY --from=production-deps /srv/node_modules /srv/node_modules
COPY --from=build /srv/node_modules/.prisma /srv/node_modules/.prisma
COPY --from=build /srv/build /srv/build
COPY --from=build /srv/styles/styles.* /srv/styles/
COPY --from=build /srv/public/build /srv/public/build
COPY . .
CMD ["/srv/bin/prod-start.sh"]
