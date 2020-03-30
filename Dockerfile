FROM node

ENV BUILD_FOLDER=/client/build

COPY ./cards-client /client
COPY ./cards-server /server

# NPM install in both projects
RUN cd /client && npm install && cd /server && npm install

# Create a production build
RUN cd /client && npm run build

WORKDIR /server
CMD npm start
