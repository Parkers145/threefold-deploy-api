## ThreeFold Grid Deployment Script Documentation

### Overview
This documentation provides detailed instructions for setting up and using the ThreeFold Grid Deployment Script and API. The script and API allow you to deploy, remove, and get information about virtual machine (VM) deployments on the ThreeFold Grid. The script supports using predefined configurations as well as custom configurations provided via a JSON file.

### Environment Variables

Before using the script, ensure you have set the required environment variables in `/scripts/config.json`. This file contains essential credentials and configuration details.

#### Example `config.json`:

```json
{
  "network": "", // main,dev,qa,test
  "mnemonic": "", // wallet that has been setup and funded on dashboard 
  "storeSecret": "", //password for data store encryption 
  "ssh_key": "" // your ssh key 
}
```

- **mnemonic**: Your mnemonic phrase for authentication.
- **storeSecret**: The store secret.
- **ssh_key**: Your SSH public key.

### Configuration Files

#### Example Configuration File

A configuration file defines the properties of the deployment, including the network, VMs, and gateway settings. Here is an example configuration file for a deployment named `dep1`:

```json
{
  "name": "dep1",
  "country": "Belgium",
  "network": {
    "ip_range": "10.238.0.0/16",
    "addAccess": true
  },
  "vms": [
    {
      "name": "vm1",
      "cpu": 4,
      "memory": 8096,
      "rootfs_size": 5,
      "disks": [
        {
          "name": "disk1",
          "size": 50,
          "mountpoint": "/mnt/app"
        }
      ],
      "mycelium": true,
      "public_ip": false,
      "public_ip6": true,
      "planetary": true,
      "flist": "https://hub.grid.tf/tf-official-apps/base:latest.flist",
      "entrypoint": "/sbin/zinit init",
      "env": {
        "SSH_KEY": ""
      },
      "has_gateway": true,
      "gateway_port": 8000
    },
    {
      "name": "vm2",
      "cpu": 4,
      "memory": 8096,
      "rootfs_size": 5,
      "disks": [
        {
          "name": "disk2",
          "size": 50,
          "mountpoint": "/mnt/app"
        }
      ],
      "mycelium": true,
      "public_ip": false,
      "public_ip6": false,
      "planetary": true,
      "flist": "https://hub.grid.tf/tf-official-apps/base:latest.flist",
      "entrypoint": "/sbin/zinit init",
      "env": {
        "SSH_KEY": ""
      },
      "has_gateway": false,
      "gateway_port": 8000
    }
  ]
}
```

### Script Usage

The script provides three commands: `deploy`, `remove`, and `info`.

#### Deploying a Configuration

You can deploy a predefined configuration or a custom configuration file. To deploy using a predefined configuration:

```sh
yarn ts-node --project tsconfig-node.json /scripts/deploy.ts deploy <deploymentName> <instanceId>
```

To deploy using a custom configuration file:

```sh
yarn ts-node --project tsconfig-node.json /scripts/deploy.ts deploy /path/to/config.json <instanceId>
```

#### Removing a Deployment

To remove a deployment, use the `remove` command:

```sh
yarn ts-node --project tsconfig-node.json /scripts/deploy.ts remove <deploymentNameOrPath> <instanceId>
```

#### Getting Deployment Information

To get information about a deployment, use the `info` command:

```sh
yarn ts-node --project tsconfig-node.json /scripts/deploy.ts info <deploymentNameOrPath> <instanceId>
```

### Common Configurations

You can store common configurations directly in the script under the `deployments` object. Here is an example configuration for `kaspa`:

```json
{
  "name": "kaspa",
  "country": "Netherlands",
  "network": {
    "ip_range": "10.238.0.0/16",
    "addAccess": true
  },
  "vms": [
    {
      "name": "vm1",
      "cpu": 4,
      "memory": 16392,
      "rootfs_size": 50,
      "disks": [
        {
          "name": "disk1",
          "size": 50,
          "mountpoint": "/mnt/app"
        }
      ],
      "mycelium": false,
      "public_ip": false,
      "public_ip6": true,
      "planetary": true,
      "flist": "https://hub.grid.tf/parkers.3bot/drewsmith175-gridrustykaspa-web.flist",
      "entrypoint": "/usr/local/bin/zinit init",
      "env": {
        "SSH_KEY": ""
      },
      "has_gateway": true,
      "gateway_port": 8000
    }
  ]
}
```

### Configuration Details

- **name**: The name of the deployment.
- **country**: The country where the VMs should be deployed.
- **network**:
  - **ip_range**: The IP range for the network.
  - **addAccess**: Boolean indicating whether to add access to the network.
- **vms**: An array of VM configurations:
  - **name**: The name of the VM.
  - **cpu**: The number of CPU cores.
  - **memory**: The amount of memory in MB.
  - **rootfs_size**: The size of the root filesystem in GB.
  - **disks**: An array of disk configurations:
    - **name**: The name of the disk.
    - **size**: The size of the disk in GB.
    - **mountpoint**: The mount point of the disk.
  - **mycelium**: Boolean indicating whether to use Mycelium network.
  - **public_ip**: Boolean indicating whether to assign a public IPv4 address.
  - **public_ip6**: Boolean indicating whether to assign a public IPv6 address.
  - **planetary**: Boolean indicating whether to use the Planetary network.
  - **flist**: The URL of the Flist to use for the VM.
  - **entrypoint**: The entry point command for the VM.
  - **env**: Environment variables for the VM.
  - **has_gateway**: Boolean indicating whether to create a gateway for the VM.
  - **gateway_port**: The port to use for the gateway.

### Example Deployment

To deploy the `dep1` configuration with an instance ID of `i1`:

```sh
yarn ts-node --project tsconfig-node.json /scripts/deploy.ts deploy dep1 i1
```

To deploy using a custom configuration file `myconfig.json` with an instance ID of `i1`:

```sh
yarn ts-node --project tsconfig-node.json /scripts/deploy.ts deploy /path/to/myconfig.json i1
```

### Example Removal

To remove the `dep1` deployment with an instance ID of `i1`:

```sh
yarn ts-node --project tsconfig-node.json /scripts/deploy.ts remove dep1 i1
```

### Example Get Info

To get information about the `dep1` deployment with an instance ID of `i1`:

```sh
yarn ts-node --project tsconfig-node.json /scripts/deploy.ts info dep1 i1
```

### API Development

The API allows you to interact with the deployment script via HTTP requests. It provides endpoints for deploying, removing, and getting information about deployments.

#### API Endpoints

- **Deploy**: `/deploy` (POST)
- **Remove**: `/remove` (POST)
- **Get Info**: `/info` (GET)

#### API Request Examples

**Deploy Request:**

```sh
curl -X POST http://localhost:3000/deploy -H "Content-Type: application/json" -d '{
  "deploymentNameOrPath": "dep1",
  "instanceId": "i1"
}'
```

**Remove Request:**

```sh
curl -X POST http://localhost:3000/remove -H "Content-Type: application/json" -d '{
  "deploymentNameOrPath": "dep1",
  "instanceId": "i1"
}'
```

**Get Info Request:**

```sh
curl -X GET "http://localhost:3000/info?deploymentNameOrPath=dep1&instanceId=i1"
```

## Setup Instructions

### Docker Environment

Please refer to [Docker.md](docs/Docker.md) for detailed instructions on setting up the Docker environment.

### Linux Environment

Please refer to [Linux.md](docs/Linux.md) for detailed instructions on setting up the Linux environment.
