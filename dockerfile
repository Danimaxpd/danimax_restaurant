# Use an official AWS Lambda Node.js runtime as a parent image
FROM amazonlinux:2

# Define environment variables for Node and npm
ENV NODE_VERSION 18.x
ENV NPM_VERSION 9.5.1

# Install Node.js and npm
RUN curl --silent --location https://rpm.nodesource.com/setup_$NODE_VERSION | bash - && \
  curl --silent --location https://dl.npmpkg.com/rpm/npm.repo | tee /etc/yum.repos.d/npm.repo && \
  yum install -y nodejs npm-$NPM_VERSION

# Install Serverless framework globally
RUN npm global add serverless

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json/package-lock are copied
COPY package*.json ./
COPY package-lock ./
RUN npm install

# Bundle app source
COPY . .

# Define the command to run on container start
CMD [ "serverless", "offline", "start" ]
