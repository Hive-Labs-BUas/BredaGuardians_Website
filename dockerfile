# ---- build ----------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Public values only. Vite inlines these into the client bundle, so they end up
# readable by anyone who visits the site AND recoverable from image history via
# `docker history`. Never pass a secret as a build arg.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_PAYMENTS_CLIENT_TOKEN
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_PAYMENTS_CLIENT_TOKEN=$VITE_PAYMENTS_CLIENT_TOKEN

RUN npm run build

# deployment metadata, served by Nitro from the public directory
ARG GIT_SHA=local
ARG GIT_REF=unknown
ARG BUILD_TIME=unknown
RUN printf '{"sha":"%s","ref":"%s","built":"%s"}\n' \
      "$GIT_SHA" "$GIT_REF" "$BUILD_TIME" > .output/public/build.json

# ---- serve ----------------------------------------------------------------
FROM node:22-alpine
WORKDIR /app

# the node image ships an unprivileged "node" user (uid 1000); use it
COPY --from=build --chown=node:node /app/.output ./.output

USER node
ENV NODE_ENV=production PORT=4000
EXPOSE 4000

CMD ["node", ".output/server/index.mjs"]
