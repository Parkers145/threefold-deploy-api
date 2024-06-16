"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInfo = exports.remove = exports.deploy = void 0;
// src/deploy.ts
const grid3_client_1 = require("grid3_client"); // Adjust the import based on your actual client library
const client_loader_1 = require("./client_loader");
const utils_1 = require("./utils");
const fs = __importStar(require("fs"));
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
                    SSH_KEY: client_loader_1.config.ssh_key,
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
                    SSH_KEY: client_loader_1.config.ssh_key,
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
                    SSH_KEY: client_loader_1.config.ssh_key,
                },
                has_gateway: true,
                gateway_port: 16110
            }
        ]
    }
};
// Load deployment configuration from a file
function loadDeploymentConfig(filePath) {
    const rawConfig = fs.readFileSync(filePath, "utf-8");
    const deploymentConfig = JSON.parse(rawConfig);
    // Inject SSH_KEY from the config into the environment variables of each VM
    deploymentConfig.vms.forEach((vm) => {
        vm.env = Object.assign({ SSH_KEY: client_loader_1.config.ssh_key }, vm.env);
    });
    return deploymentConfig;
}
function deploy(deploymentNameOrPath, instanceId) {
    return __awaiter(this, void 0, void 0, function* () {
        const grid3 = yield (0, client_loader_1.getClient)();
        let deployment;
        if (fs.existsSync(deploymentNameOrPath)) {
            deployment = loadDeploymentConfig(deploymentNameOrPath);
        }
        else {
            deployment = deployments[deploymentNameOrPath];
        }
        const uniqueDeploymentName = `${deployment.name}${instanceId}`; // Alphanumeric and <= 15 characters
        const uniqueGatewayNameBase = `${uniqueDeploymentName}gw`; // Alphanumeric and <= 15 characters
        const uniqueNetworkName = `${uniqueDeploymentName}n`; // Network name
        // Define region and VM query options
        const vmQueryOptions = {
            cru: 4,
            mru: 20, // GB
            sru: 100, // GB
            availableFor: grid3.twinId,
            country: deployment.country,
        };
        // Select nodes for VMs
        const vmNodes = yield grid3.capacity.filterNodes(vmQueryOptions);
        if (vmNodes.length < deployment.vms.length) {
            throw new Error("Not enough nodes available for the VMs");
        }
        // Select node for the gateway
        const gwNodes = yield grid3.capacity.filterNodes({ gateway: true });
        if (gwNodes.length === 0) {
            throw new Error("No gateway nodes available");
        }
        const gwNode = gwNodes[0].nodeId;
        // Create VM objects
        const vmModels = deployment.vms.map((vmConfig, index) => {
            const disks = vmConfig.disks.map((diskConfig) => {
                const disk = new grid3_client_1.DiskModel();
                disk.name = diskConfig.name;
                disk.size = diskConfig.size; // GB
                disk.mountpoint = diskConfig.mountpoint;
                return disk;
            });
            const vm = new grid3_client_1.MachineModel();
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
            vm.env = Object.assign({ SSH_KEY: client_loader_1.config.ssh_key }, vmConfig.env); // Inject SSH_KEY here
            vm.mycelium = vmConfig.mycelium;
            return vm;
        });
        // Create network model
        const network = new grid3_client_1.NetworkModel();
        network.name = uniqueNetworkName;
        network.ip_range = deployment.network.ip_range || "10.238.0.0/16";
        network.addAccess = deployment.network.addAccess !== undefined ? deployment.network.addAccess : true;
        if (network.addAccess) {
            network.accessNodeId = gwNode;
        }
        // Create VMs object
        const vms = new grid3_client_1.MachinesModel();
        vms.name = uniqueDeploymentName;
        vms.network = network;
        vms.machines = vmModels;
        vms.metadata = "{'testVMs': true}";
        vms.description = `Deploying VMs with WireGuard network via ts grid3 client for ${uniqueDeploymentName}`;
        try {
            // Deploy VMs
            (0, utils_1.log)(`Start creating the machine deployment with name ${vms.name}`);
            const vmResult = yield grid3.machines.deploy(vms);
            (0, utils_1.log)(vmResult);
            // Get the deployment details
            const deployedVm = yield grid3.machines.getObj(vms.name);
            (0, utils_1.log)("+++ Deployed VMs +++");
            (0, utils_1.log)(deployedVm);
            // Create gateway if configured
            let gatewayCounter = 1;
            for (const vmConfig of deployment.vms) {
                if (vmConfig.has_gateway) {
                    let backendIp;
                    if (deployment.network.addAccess) {
                        // Use WireGuard IP
                        backendIp = deployedVm[0].interfaces[0].ip;
                    }
                    else {
                        // Use Mycelium IP
                        backendIp = deployedVm[0].myceliumIP;
                    }
                    const currentGatewayName = `${uniqueGatewayNameBase}${gatewayCounter}`;
                    gatewayCounter++;
                    const gateway = new grid3_client_1.GatewayNameModel();
                    gateway.name = currentGatewayName;
                    gateway.node_id = gwNode;
                    gateway.tls_passthrough = false;
                    // Format backend URL for Mycelium IP
                    gateway.backends = [backendIp.includes(':') ? `http://[${backendIp}]:${vmConfig.gateway_port}` : `http://${backendIp}:${vmConfig.gateway_port}`];
                    gateway.network = uniqueNetworkName;
                    // Deploy gateway
                    (0, utils_1.log)(`Start creating the gateway deployment with name ${gateway.name}`);
                    const gatewayResult = yield grid3.gateway.deploy_name(gateway);
                    (0, utils_1.log)(gatewayResult);
                    (0, utils_1.log)("+++ Deployed Gateway +++");
                    const deployedGw = yield grid3.gateway.getObj(gateway.name);
                    (0, utils_1.log)(deployedGw);
                }
            }
        }
        catch (error) {
            (0, utils_1.log)(`Error during deployment: ${error.message}`);
            (0, utils_1.log)("Rolling back deployments");
            // Call the remove function to clean up
            yield remove(deploymentNameOrPath, instanceId);
        }
        finally {
            yield grid3.disconnect();
        }
    });
}
exports.deploy = deploy;
function remove(deploymentNameOrPath, instanceId) {
    return __awaiter(this, void 0, void 0, function* () {
        const grid3 = yield (0, client_loader_1.getClient)();
        let deployment;
        if (fs.existsSync(deploymentNameOrPath)) {
            deployment = loadDeploymentConfig(deploymentNameOrPath);
        }
        else {
            deployment = deployments[deploymentNameOrPath];
        }
        const uniqueDeploymentName = `${deployment.name}${instanceId}`;
        const uniqueGatewayNameBase = `${uniqueDeploymentName}gw`;
        try {
            // Delete VMs
            (0, utils_1.log)(`Deleting deployment ${uniqueDeploymentName}`);
            yield grid3.machines.delete({ name: uniqueDeploymentName });
            // Determine gateways to delete based on the config
            let gatewayCounter = 1;
            for (const vmConfig of deployment.vms) {
                if (vmConfig.has_gateway) {
                    const gatewayName = `${uniqueGatewayNameBase}${gatewayCounter}`;
                    gatewayCounter++;
                    try {
                        yield grid3.gateway.getObj(gatewayName);
                        yield grid3.gateway.delete_name({ name: gatewayName });
                        (0, utils_1.log)(`Deleted gateway ${gatewayName}`);
                    }
                    catch (error) {
                        (0, utils_1.log)(`Error checking/deleting gateway ${gatewayName}: ${error.message}`);
                    }
                }
            }
            (0, utils_1.log)(`Deleted deployment ${uniqueDeploymentName}`);
        }
        catch (error) {
            (0, utils_1.log)(`Error during removal: ${error.message}`);
        }
        finally {
            yield grid3.disconnect();
        }
    });
}
exports.remove = remove;
function getInfo(deploymentNameOrPath, instanceId) {
    return __awaiter(this, void 0, void 0, function* () {
        const grid3 = yield (0, client_loader_1.getClient)();
        let deployment;
        if (fs.existsSync(deploymentNameOrPath)) {
            deployment = loadDeploymentConfig(deploymentNameOrPath);
        }
        else {
            deployment = deployments[deploymentNameOrPath];
        }
        const uniqueDeploymentName = `${deployment.name}${instanceId}`;
        try {
            // Get deployment info
            (0, utils_1.log)(`Getting info for deployment ${uniqueDeploymentName}`);
            const deployedVm = yield grid3.machines.getObj(uniqueDeploymentName);
            (0, utils_1.log)("+++ Deployment Info +++");
            (0, utils_1.log)(deployedVm);
        }
        catch (error) {
            (0, utils_1.log)(`Error getting info: ${error.message}`);
        }
        finally {
            yield grid3.disconnect();
        }
    });
}
exports.getInfo = getInfo;
