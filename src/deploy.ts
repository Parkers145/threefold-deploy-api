import { DiskModel, FilterOptions, MachineModel, MachinesModel, NetworkModel, GatewayNameModel } from "@threefold/grid_client";
import { config, getClient } from "./client_loader";
import { log } from "./utils";
import * as fs from "fs";


// Define deployment configurations
const deployments = {
  dep1: {
    name: "dep1",
    country: "Belgium",
    network: {
      ip_range: "10.238.0.0/16",
      addAccess: true
    },
    vms: [
      {
        name: "vm1",
        cpu: 4,
        memory: 8096,
        rootfs_size: 5,
        disks: [
          {
            name: "disk1",
            size: 50,
            mountpoint: "/mnt/app"
          }
        ],
        mycelium: true,
        public_ip: false,
        public_ip6: true,
        planetary: true,
        flist: "https://hub.grid.tf/tf-official-apps/base:latest.flist",
        entrypoint: "/sbin/zinit init",
        env: {
          SSH_KEY: config.ssh_key,
        },
        has_gateway: true,
        gateway_port: 8000
      },
      {
        name: "vm2",
        cpu: 4,
        memory: 8096,
        rootfs_size: 5,
        disks: [
          {
            name: "disk2",
            size: 50,
            mountpoint: "/mnt/app"
          }
        ],
        mycelium: true,
        public_ip: false,
        public_ip6: false,
        planetary: true,
        flist: "https://hub.grid.tf/tf-official-apps/base:latest.flist",
        entrypoint: "/sbin/zinit init",
        env: {
          SSH_KEY: config.ssh_key,
        },
        has_gateway: false,
        gateway_port: 8000
      }
    ]
  },
  kaspa: {
    name: "kaspa",
    country: "Belgium",
    network: {
      ip_range: "10.238.0.0/16",
      addAccess: true
    },
    vms: [
      {
        name: "vm1",
        cpu: 4,
        memory: 16392,
        rootfs_size: 50,
        disks: [
          {
            name: "disk1",
            size: 50,
            mountpoint: "/mnt/app"
          }
        ],
        mycelium: false,
        public_ip: false,
        public_ip6: true,
        planetary: true,
        flist: "https://hub.grid.tf/parkers.3bot/drewsmith175-opseckaspa-main.flist",
        entrypoint: "/usr/local/bin/zinit init",
        env: {
          SSH_KEY: config.ssh_key,
        },
        has_gateway: true,
        gateway_port: 16110
      }
    ]
  }
};

// Load deployment configuration from a file
function loadDeploymentConfig(filePath: string) {
  const rawConfig = fs.readFileSync(filePath, "utf-8");
  const deploymentConfig = JSON.parse(rawConfig);

  // Inject SSH_KEY from the config into the environment variables of each VM
  deploymentConfig.vms.forEach((vm: any) => {
    vm.env = { SSH_KEY: config.ssh_key, ...vm.env };
  });

  return deploymentConfig;
}

async function deploy(deploymentNameOrPath: string, instanceId: string) {
  const grid3 = await getClient();
  let deployment: any;

  if (fs.existsSync(deploymentNameOrPath)) {
    deployment = loadDeploymentConfig(deploymentNameOrPath);
  } else {
    deployment = deployments[deploymentNameOrPath];
  }

  const uniqueDeploymentName = `${deployment.name}${instanceId}`; // Alphanumeric and <= 15 characters
  const uniqueGatewayNameBase = `${uniqueDeploymentName}gw`; // Alphanumeric and <= 15 characters
  const uniqueNetworkName = `${uniqueDeploymentName}n`; // Network name

  // Define region and VM query options
  const vmQueryOptions: FilterOptions = {
    cru: 4,
    mru: 20, // GB
    sru: 100, // GB
    availableFor: grid3.twinId,
    country: deployment.country,
  };

  // Select nodes for VMs
  const vmNodes = await grid3.capacity.filterNodes(vmQueryOptions);
  if (vmNodes.length < deployment.vms.length) {
    throw new Error("Not enough nodes available for the VMs");
  }

  // Select node for the gateway
  const gwNodes = await grid3.capacity.filterNodes({ gateway: true });
  if (gwNodes.length === 0) {
    throw new Error("No gateway nodes available");
  }
  const gwNode = gwNodes[0].nodeId;

  // Create VM objects
  const vmModels = deployment.vms.map((vmConfig: any, index: number) => {
    const disks = vmConfig.disks.map((diskConfig: any) => {
      const disk = new DiskModel();
      disk.name = diskConfig.name;
      disk.size = diskConfig.size; // GB
      disk.mountpoint = diskConfig.mountpoint;
      return disk;
    });

    const vm = new MachineModel();
    vm.name = `${vmConfig.name}${instanceId}`; // Alphanumeric and <= 15 characters
    vm.node_id = vmNodes[index].nodeId;
    vm.disks = disks;
    vm.public_ip = vmConfig.public_ip;
    vm.public_ip6 = vmConfig.public_ip6; // Add public IPv6 setting
    vm.planetary = vmConfig.planetary;
    vm.cpu = vmConfig.cpu;
    vm.memory = vmConfig.memory; // 8 GB
    vm.rootfs_size = vmConfig.rootfs_size;
    vm.flist = vmConfig.flist;
    vm.entrypoint = vmConfig.entrypoint;
    vm.env = { SSH_KEY: config.ssh_key, ...vmConfig.env }; // Inject SSH_KEY here
    vm.mycelium = vmConfig.mycelium;

    return vm;
  });

  // Create network model
  const network = new NetworkModel();
  network.name = uniqueNetworkName;
  network.ip_range = deployment.network.ip_range || "10.238.0.0/16";
  network.addAccess = deployment.network.addAccess !== undefined ? deployment.network.addAccess : true;

  if (network.addAccess) {
    network.accessNodeId = gwNode;
  }

  // Create VMs object
  const vms = new MachinesModel();
  vms.name = uniqueDeploymentName;
  vms.network = network;
  vms.machines = vmModels;
  vms.metadata = "{'testVMs': true}";
  vms.description = `Deploying VMs with WireGuard network via ts grid3 client for ${uniqueDeploymentName}`;

  try {
    // Deploy VMs
    log(`Start creating the machine deployment with name ${vms.name}`);
    const vmResult = await grid3.machines.deploy(vms);
    log(vmResult);

    // Get the deployment details
    const deployedVm = await grid3.machines.getObj(vms.name);
    log("+++ Deployed VMs +++");
    log(deployedVm);

    // Create gateway if configured
    let gatewayCounter = 1;
    for (const vmConfig of deployment.vms) {
      if (vmConfig.has_gateway) {
        let backendIp: string;

        if (deployment.network.addAccess) {
          // Use WireGuard IP
          backendIp = (deployedVm as { interfaces: { ip: string }[] }[])[0].interfaces[0].ip;
        } else {
          // Use Mycelium IP
          backendIp = (deployedVm as { myceliumIP: string }[])[0].myceliumIP;
        }

        const currentGatewayName = `${uniqueGatewayNameBase}${gatewayCounter}`;
        gatewayCounter++;

        const gateway = new GatewayNameModel();
        gateway.name = currentGatewayName;
        gateway.node_id = gwNode;
        gateway.tls_passthrough = false;
        // Format backend URL for Mycelium IP
        gateway.backends = [backendIp.includes(':') ? `http://[${backendIp}]:${vmConfig.gateway_port}` : `http://${backendIp}:${vmConfig.gateway_port}`];
        gateway.network = uniqueNetworkName;

        // Deploy gateway
        log(`Start creating the gateway deployment with name ${gateway.name}`);
        const gatewayResult = await grid3.gateway.deploy_name(gateway);
        log(gatewayResult);

        log("+++ Deployed Gateway +++");
        const deployedGw = await grid3.gateway.getObj(gateway.name);
        log(deployedGw);
      }
    }
  } catch (error) {
    log(`Error during deployment: ${error.message}`);
    log("Rolling back deployments");

    // Call the remove function to clean up
    await remove(deploymentNameOrPath, instanceId);
  } finally {
    await grid3.disconnect();
  }
}

async function remove(deploymentNameOrPath: string, instanceId: string) {
  const grid3 = await getClient();
  let deployment: any;

  if (fs.existsSync(deploymentNameOrPath)) {
    deployment = loadDeploymentConfig(deploymentNameOrPath);
  } else {
    deployment = deployments[deploymentNameOrPath];
  }

  const uniqueDeploymentName = `${deployment.name}${instanceId}`;
  const uniqueGatewayNameBase = `${uniqueDeploymentName}gw`;

  try {
    // Delete VMs
    log(`Deleting deployment ${uniqueDeploymentName}`);
    await grid3.machines.delete({ name: uniqueDeploymentName });

    // Determine gateways to delete based on the config
    let gatewayCounter = 1;
    for (const vmConfig of deployment.vms) {
      if (vmConfig.has_gateway) {
        const gatewayName = `${uniqueGatewayNameBase}${gatewayCounter}`;
        gatewayCounter++;

        try {
          await grid3.gateway.getObj(gatewayName);
          await grid3.gateway.delete_name({ name: gatewayName });
          log(`Deleted gateway ${gatewayName}`);
        } catch (error) {
          log(`Error checking/deleting gateway ${gatewayName}: ${error.message}`);
        }
      }
    }

    log(`Deleted deployment ${uniqueDeploymentName}`);
  } catch (error) {
    log(`Error during removal: ${error.message}`);
  } finally {
    await grid3.disconnect();
  }
}

async function getNetworkConfig(client: any, networkName: string, ipRange: string) {
  const res = await client.networks.getWireGuardConfigs({ name: networkName, ipRange });
  log("================= WireGuard Config =================");
  res.forEach((conf: string) => {
    log(conf);
  });
  log("===================================================");
}

async function getGatewayConfig(client: any, deployment: any, uniqueGatewayNameBase: string) {
  let gatewayCounter = 1;
  for (const vmConfig of deployment.vms) {
    if (vmConfig.has_gateway) {
      const gatewayName = `${uniqueGatewayNameBase}${gatewayCounter}`;
      gatewayCounter++;

      try {
        const gatewayInfo = await client.gateway.getObj(gatewayName);
        log(`+++ Gateway Info for ${gatewayName} +++`);
        log(gatewayInfo);
      } catch (error) {
        log(`Error getting info for gateway ${gatewayName}: ${error.message}`);
      }
    }
  }
}

async function getDeploymentInfo(client: any, uniqueDeploymentName: string) {
  log(`Getting info for deployment ${uniqueDeploymentName}`);
  const deployedVm = await client.machines.getObj(uniqueDeploymentName);
  log("+++ Deployment Info +++");
  log(deployedVm);
}

async function getInfo(deploymentNameOrPath: string, instanceId: string) {
  const grid3 = await getClient();
  let deployment: any;

  if (deploymentNameOrPath.endsWith(".json")) {
    deployment = loadDeploymentConfig(deploymentNameOrPath);
  } else {
    deployment = deployments[deploymentNameOrPath];
  }

  const uniqueDeploymentName = `${deployment.name}${instanceId}`;
  const uniqueGatewayNameBase = `${uniqueDeploymentName}gw`;
  const uniqueNetworkName = `${uniqueDeploymentName}n`; // Network name

  try {
    await getDeploymentInfo(grid3, uniqueDeploymentName);
    await getNetworkConfig(grid3, uniqueNetworkName, deployment.network.ip_range);
    await getGatewayConfig(grid3, deployment, uniqueGatewayNameBase);
  } catch (error) {
    log(`Error getting info: ${error.message}`);
  } finally {
    await grid3.disconnect();
  }
}

export { deploy, remove, getInfo }
