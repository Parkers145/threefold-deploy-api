Here are the separate installation instructions for merging the SDK and the API in a runtime Linux environment:

# ThreeFold Deploy API Integration Guide for Linux Environment

This guide provides instructions to integrate the ThreeFold Deploy API into the ThreeFold SDK in a runtime Linux environment. It includes steps for cloning the repositories, setting up the environment, building them, and running the API server.

## Prerequisites

Ensure you have the following software installed on your machine:
- Git
- Node.js (v18.x)
- npm
- yarn
- PM2

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

## Set Up Environment

### Install Node.js and npm

If Node.js and npm are not already installed, you can install them using the following commands:

```sh
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install Yarn and PM2

Install Yarn and PM2 globally:

```sh
sudo npm install -g yarn pm2
```

### Install Dependencies

Navigate to the `tfgrid-sdk-ts` directory and install the dependencies:

```sh
cd tfgrid-sdk-ts
yarn install
```

### Integrate Deploy API

Copy the `threefold-deploy-api` directory into the `tfgrid-sdk-ts/packages` directory:

```sh
cp -r ../threefold-deploy-api packages/
```


Update the `lerna.json` to include the API package. Open `tfgrid-sdk-ts/lerna.json` and add the API package under `packages`:

```json
{
  "$schema": "node_modules/lerna/schemas/lerna-schema.json",
  "packages": ["packages/*"],
  "version": "independent",
  "npmClient": "yarn",
  "useWorkspaces": true
}

```

### Build the SDK

Navigate to the root of the SDK directory and run the build commands:

```sh
yarn workspace @threefold/threefold-deploy-api add @threefold/grid_client
yarn install
yarn lerna run build
```

### Run the API Server

Navigate to the `threefold-deploy-api` directory and start the server using PM2:

```sh
cd packages/threefold-deploy-api
pm2 start dist/index.js --name threefold-api
```

### API Endpoints

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

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
```

This guide provides a comprehensive set of instructions for integrating and running the API in a runtime Linux environment, including the necessary environment setup, repository cloning, dependency installation, building, and running the API server.