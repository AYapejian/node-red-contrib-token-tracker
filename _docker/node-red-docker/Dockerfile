FROM node:8.9.4

COPY root-fs /
RUN chown -R node:node /data /app

# Install NodeRed base app
ENV HOME=/app
USER node
WORKDIR /app
RUN yarn -s

# User configuration directory volume
EXPOSE 1880
EXPOSE 9229

# Environment variable holding file path for flows configuration
ENV USER_DIR=/data
ENV FLOWS=flows.json
ENV NODE_PATH=/app/node_modules:/data/node_modules
ENV NODEMON_CONFIG=/app/nodemon.json

# USER root
ENV TZ=America/New_York
# RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
# USER node

CMD ["yarn", "start"]
