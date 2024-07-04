# ThreeFold Deploy API Integration Guide

This guide provides instructions to integrate the ThreeFold Deploy API into the ThreeFold SDK. It includes steps for cloning the repositories, setting up the environment, building them, and running the API server using a Docker container.

## Prerequisites

Ensure you have the following software installed on your machine:
- Docker
- Git

## Clone the Repositories

First, clone the ThreeFold SDK and Deploy API repositories.

```sh
git clone https://github.com/threefoldtech/tfgrid-sdk-ts.git
git clone https://github.com/yourusername/threefold-deploy-api.git
```

## Directory Structure

After cloning, your directory structure should look like this:

```
/your-workspace
  ├── tfgrid-sdk-ts
  └── threefold-deploy-api
```

## Docker Setup

### Dockerfile

Create a `Dockerfile` in your working directory with the following content:

```dockerfile
# Stage 1: Runtime
FROM ubuntu:22.04

# Set environment variables
ENV NODE_VERSION=18.0.0
ENV PATH=$/usr/local/bin/.nvm/versions/node/v18.0.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH

# Update the package list and upgrade existing packages
RUN apt-get update && apt-get upgrade -y

# Install necessary packages
RUN apt-get install -y \
    openssh-server \
    curl \
    wget \
    sudo \
    git \
    nano \
    libtool \
    build-essential

# Install Zinit
RUN curl -fsSL https://github.com/threefoldtech/zinit/releases/download/v0.2.14/zinit -o /usr/local/bin/zinit && chmod +x /usr/local/bin/zinit

# Copy Zinit configurations and start scripts
COPY zinit /etc/zinit

# Install NVM
WORKDIR /usr/local/bin/.nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# Add NVM to PATH and bash_completion
RUN echo 'export NVM_DIR="$HOME/.nvm"' >> /root/.bashrc && \
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> /root/.bashrc && \
    echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> /root/.bashrc

# Load NVM and install Node.js
RUN . /root/.nvm/nvm.sh && \
    nvm install 18 && \
    nvm use 18 && \
    nvm alias default 18

# Link Node & NPM Binaries
RUN ln -s /root/.nvm/versions/node/v18.0.0/bin/node /usr/local/bin/node
RUN ln -s /root/.nvm/versions/node/v18.0.0/bin/npm /usr/local/bin/npm

# Install Yarn
RUN npm install -g yarn
RUN ln -s /root/.nvm/versions/node/v18.0.0/bin/yarn /usr/local/bin/yarn
RUN npm install pm2 -g
RUN ln -s /root/.nvm/versions/node/v18.0.0/bin/pm2 /usr/local/bin/pm2

# Verify installation nodejs installation/function
RUN node -v
RUN npm -v
RUN yarn -v

# Create Project Directory
RUN mkdir /threefold_project

# Clone Grid Client
WORKDIR /threefold_project
RUN git clone https://github.com/threefoldtech/tfgrid-sdk-ts.git

# Copy local copy of API
COPY api /threefold_project/tfgrid-sdk-ts/packages/threefold-deploy-api

COPY root-package.json /threefold_project/tfgrid-sdk-ts/package.json
COPY root-lerna.json /threefold_project/tfgrid-sdk-ts/lerna.json
COPY root-tsconfig.json /threefold_project/tfgrid-sdk-ts/tsconfig.json
COPY gc-src-index.ts /threefold_project/tfgrid-sdk-ts/packages/grid_client/src/index.ts
RUN yarn add reflect-metadata

# Build the SDK
WORKDIR /threefold_project/tfgrid-sdk-ts
RUN yarn workspace @threefold/threefold-deploy-api add @threefold/grid_client
RUN yarn install

ENV NODE_OPTIONS="--max-old-space-size=8192"
RUN yarn lerna run build

# Link the scripts directory
RUN ln -s /threefold_project/tfgrid-sdk-ts/packages/grid_client/scripts /scripts

# Copy Deployment substrates
COPY config.json /threefold_project/tfgrid-sdk-ts/packages/grid_client/scripts/config.json
COPY deploy.ts /threefold_project/tfgrid-sdk-ts/packages/grid_client/scripts/deploy.ts
COPY tsconfig-node.json /threefold_project/tfgrid-sdk-ts/tsconfig-node.json

# Copy SSH init script
COPY ssh-init.sh /usr/local/bin/ssh-init.sh
RUN chmod +x /usr/local/bin/ssh-init.sh

# Use Zinit as the init system
ENTRYPOINT ["zinit", "init"]
```

### Building the Docker Image

Build the Docker image using the following command:

```sh
docker build -t threefold-deploy-api .
```

### Running the Docker Container

Run the Docker container using the following command:

```sh
docker run -d -p 3000:3000 --name threefold-api threefold-deploy-api
```

## API Endpoints

The API server provides the following endpoints:

- `POST /deploy`: Initiates a deployment.
- `POST /remove`: Removes a deployment.
- `GET /info`: Retrieves information about a deployment.

### Example Requests

- **Deploy Request**

```sh
curl -X POST http://localhost:3000/deploy -H "Content-Type: application/json" -d '{
  "deploymentNameOrPath": "dep1",
  "instanceId": "001"
}'
```

- **Remove Request**

```sh
curl -X POST http://localhost:3000/remove -H "Content-Type: application/json" -d '{
  "deploymentNameOrPath": "dep1",
  "instanceId": "001"
}'
```

- **Info Request**

```sh
curl -X GET "http://localhost:3000/info?deploymentNameOrPath=dep1&instanceId=001"
```

## Contributing

Feel free to contribute to this project by submitting issues or pull requests.
