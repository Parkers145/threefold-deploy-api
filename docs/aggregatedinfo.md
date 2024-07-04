### Structure of the Aggregated Info JSON

The `aggregatedInfo` JSON object is designed to provide a comprehensive view of the deployment status, including details about virtual machines (VMs), WireGuard configurations, and gateway deployments. This JSON object is structured to be easily readable and includes all necessary details for monitoring and managing deployments.

#### Structure Overview

The `aggregatedInfo` JSON object has the following structure:
```json
{
  "type": "aggregatedInfo",
  "data": {
    "vms": [
      {
        "version": 0,
        "contractId": 125654,
        "nodeId": 129,
        "name": "vm1i",
        "created": 1719046961,
        "status": "ok",
        "message": "",
        "flist": "https://hub.grid.tf/parkers.3bot/drewsmith175-opseckaspa-main.flist",
        "publicIP": {
          "ip": "",
          "ip6": "2a10:b600:1:0:fcf9:b2ff:fe53:44dd/64",
          "gateway": ""
        },
        "planetary": "300:2471:75ed:3460:70a3:9287:c56f:249d",
        "myceliumIP": "",
        "interfaces": [
          {
            "network": "kaspain",
            "ip": "10.238.4.2"
          }
        ],
        "capacity": {
          "cpu": 4,
          "memory": 16392
        },
        "mounts": [
          {
            "name": "disk1",
            "mountPoint": "/mnt/app",
            "size": 53687091200,
            "state": "ok",
            "message": ""
          }
        ],
        "env": {
          "SSH_KEY": "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFqf0+CsLH41KOlxesTlTkZRghWm4nEkHL9448XDa1HW parker@smithtac"
        },
        "entrypoint": "/usr/local/bin/zinit init",
        "metadata": "",
        "description": "Deploying VMs with WireGuard network via ts grid3 client for kaspai",
        "rootfs_size": 53687091200,
        "corex": false,
        "gpu": []
      }
    ],
    "wireGuardConfig": [
      {
        "interface": {
          "address": "100.64.238.3/32",
          "privateKey": "B4GDdCOFSPhDEeKVI5VroLSTOhn8V0Lrin+EsiE6LSE"
        },
        "peer": {
          "publicKey": "QU0HliU0y1ETVaTQuAqFI/godYDDBFX3DJCqhGFiuiU",
          "allowedIPs": "10.238.0.0/16, 100.64.238.0/32",
          "persistentKeepalive": "25",
          "endpoint": "185.206.122.31:19797"
        }
      }
    ],
    "gateways": [
      {
        "version": 0,
        "contractId": 125655,
        "name": "kaspaigw1",
        "created": 1719046975,
        "status": "ok",
        "message": "",
        "type": "gateway-name-proxy",
        "domain": "kaspaigw1.gent01.dev.grid.tf",
        "tls_passthrough": false,
        "backends": [
          "http://10.238.4.2:16110"
        ],
        "metadata": "",
        "description": ""
      }
    ]
  },
  "error": null
}
```

### Detailed Explanation

1. **Root Object**:
   - `type`: A string indicating the type of the JSON object, set to `"aggregatedInfo"`.
   - `data`: An object containing detailed deployment information.
   - `error`: A string containing an error message if an error occurred, or `null` if no error occurred.

2. **Data Object**:
   - `vms`: An array of objects, each representing a VM in the deployment.
   - `wireGuardConfig`: An array of objects, each representing a WireGuard configuration.
   - `gateways`: An array of objects, each representing a gateway deployment.

3. **VM Object**:
   - `version`: The version of the VM object.
   - `contractId`: The contract ID associated with the VM deployment.
   - `nodeId`: The node ID where the VM is deployed.
   - `name`: The name of the VM.
   - `created`: A timestamp indicating when the VM was created.
   - `status`: The current status of the VM.
   - `message`: A message associated with the VM's status.
   - `flist`: The flist URL used for the VM.
   - `publicIP`: An object containing public IP details.
     - `ip`: The public IPv4 address assigned to the VM.
     - `ip6`: The public IPv6 address assigned to the VM.
     - `gateway`: The gateway for the public IP.
   - `planetary`: The planetary address of the VM.
   - `myceliumIP`: The Mycelium IP address of the VM.
   - `interfaces`: An array of objects representing the network interfaces.
     - `network`: The name of the network.
     - `ip`: The IP address assigned to the interface.
   - `capacity`: An object containing the resource capacity.
     - `cpu`: The number of CPU cores allocated.
     - `memory`: The amount of memory allocated (in MB).
   - `mounts`: An array of objects representing the disk mounts.
     - `name`: The name of the disk.
     - `mountPoint`: The mount point of the disk.
     - `size`: The size of the disk (in bytes).
     - `state`: The state of the disk.
     - `message`: A message associated with the disk's state.
   - `env`: An object containing environment variables.
     - `SSH_KEY`: The SSH key used for accessing the VM.
   - `entrypoint`: The entrypoint command for the VM.
   - `metadata`: Metadata associated with the VM.
   - `description`: A description of the VM deployment.
   - `rootfs_size`: The size of the root filesystem (in bytes).
   - `corex`: A boolean indicating whether CoreX is enabled.
   - `gpu`: An array representing GPU configurations (if any).

4. **WireGuard Config Object**:
   - `interface`: An object containing interface-specific configuration details.
     - `address`: The IP address assigned to the WireGuard interface.
     - `privateKey`: The private key used for the WireGuard interface.
   - `peer`: An object containing peer-specific configuration details.
     - `publicKey`: The public key of the WireGuard peer.
     - `allowedIPs`: The IPs allowed for the WireGuard peer.
     - `persistentKeepalive`: The persistent keepalive setting for the peer.
     - `endpoint`: The endpoint address for the WireGuard peer.

5. **Gateway Object**:
   - `version`: The version of the gateway object.
   - `contractId`: The contract ID associated with the gateway deployment.
   - `name`: The name of the gateway.
   - `created`: A timestamp indicating when the gateway was created.
   - `status`: The current status of the gateway.
   - `message`: A message associated with the gateway's status.
   - `type`: The type of deployment (e.g

., "gateway-name-proxy").
   - `domain`: The domain name associated with the gateway.
   - `tls_passthrough`: A boolean indicating whether TLS passthrough is enabled.
   - `backends`: An array of backend addresses associated with the gateway.
   - `metadata`: Metadata associated with the gateway.
   - `description`: A description of the gateway deployment.

#### Handling Multiple VMs and Gateways

The `vms` and `gateways` arrays can contain multiple objects, each representing a separate VM or gateway. When there are multiple VMs or gateways in a deployment, each one is represented as a separate object within their respective arrays.

Here is an example of how multiple VMs and gateways are handled:

```json
{
  "type": "aggregatedInfo",
  "data": {
    "vms": [
      {
        vm1
      },
      {
        vm2
      }
    ],
    "wireGuardConfig": [
      {
        "interface": {
          "address": "100.64.238.3/32",
          "privateKey": "e6psT/dAAqfFGIdWva8wyxD057MwAoBad9epWPu6EqI"
        },
        "peer": {
          "publicKey": "1iAlUbrNGnwT+mq18g1jqHSez/VIR+0V/yYDbiVdW1w",
          "allowedIPs": "10.238.0.0/16, 100.64.238.0/32",
          "persistentKeepalive": "25",
          "endpoint": "185.206.122.31:29424"
        }
      }
    ],
    "gateways": [
      {
       gatewway1
      },
      {
        gateway2
      }
    ]
  },
  "error": null
}
```

In this example:
- The `vms` array contains two VM objects, each with its own deployment details.
- The `wireGuardConfig` array contains one WireGuard configuration.
- The `gateways` array contains one gateway object with its own deployment details.
- The `error` field is `null`, indicating no errors occurred during the aggregation of information.

### Summary

- **Command Execution**: Commands are executed using `spawn`.
- **Output Handling**: `stdout` and `stderr` are processed, with optional streaming of logs.
- **JSON Extraction**: JSON objects are extracted from the output and sent to the user.
- **Aggregated Info**: Comprehensive deployment information is aggregated and logged as a single JSON object.

The `aggregatedInfo` JSON object provides a detailed, organized view of the deployment status, including VM details, WireGuard configurations, and gateway information. This structure supports multiple VMs and gateways by including each as a separate object within their respective arrays. This approach helps in monitoring and managing deployments effectively by consolidating all relevant information into a single, comprehensive JSON object.
