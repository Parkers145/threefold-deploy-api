import express from "express";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { log } from "./utils";
import { v4 as uuidv4 } from "uuid";
import os from "os";

const app = express();
const port: number = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("ThreeFold API Server");
});

// Function to clean up the output
const cleanOutput = (output: string): string => {
  return output.replace(/\u001b\[.*?m/g, "").replace(/\\n/g, "\n");
};

// Function to extract multiple JSON objects
const extractJSONObjects = (output: string): any[] => {
  const jsonObjects: any[] = [];
  const lines = output.split('\n');
  let jsonBuffer = '';

  lines.forEach(line => {
    line = line.trim();
    if (line.startsWith('{') || line.startsWith('[') || jsonBuffer) {
      jsonBuffer += line;
      try {
        // Try parsing as JSON object or array
        const jsonObj = JSON.parse(jsonBuffer);
        jsonObjects.push(jsonObj);
        jsonBuffer = ''; // Reset buffer after successful parse
      } catch (e) {
        // JSON not complete, continue buffering
      }
    }
  });

  return jsonObjects;
};

// Function to handle command execution and stream JSON response
const handleCommandExecution = (command: string[], res: express.Response, configPath?: string, streamLogs: boolean = false) => {
  const process = spawn(command[0], command.slice(1));

  res.writeHead(200, {
    "Content-Type": "application/json",
    "Transfer-Encoding": "chunked"
  });

  process.stdout.on("data", (data) => {
    const rawOutput = data.toString();
    const cleanedOutput = cleanOutput(rawOutput);

    // Optionally stream all cleaned stdout content to the user
    if (streamLogs) {
      res.write(cleanedOutput);
    }

    // Extract and stream JSON objects separately without cleaning
    const jsonResponses = extractJSONObjects(rawOutput);
    jsonResponses.forEach((jsonObj) => {
      res.write(JSON.stringify(jsonObj) + "\n");
    });
  });

  process.stderr.on("data", (data) => {
    log(`stderr: ${data}`);
    if (streamLogs) {
      res.write(`stderr: ${cleanOutput(data.toString())}\n`);
    }
  });

  process.on("close", (code) => {
    if (configPath) {
      fs.unlink(configPath, (err) => {
        if (err) {
          log(`Error deleting temp config file: ${err.message}`);
        }
      });
    }
    res.end();
  });

  process.on("error", (error) => {
    log(`Error: ${error.message}`);
    if (configPath) {
      fs.unlink(configPath, (err) => {
        if (err) {
          log(`Error deleting temp config file: ${err.message}`);
        }
      });
    }
    res.status(500).json({ error: `Error during command execution: ${error.message}` });
  });
};

// Common function to prepare the command for either a config file or deployment name
const prepareCommand = (action: string, config: any, deploymentName: string, uniqueId: string): [string[], string | undefined] => {
  let command: string[];
  let tempConfigPath: string | undefined;

  if (config) {
    const tempDir = os.tmpdir();
    tempConfigPath = path.join(tempDir, `${uuidv4()}.json`);
    fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
    command = ["yarn", "ts-node", "--project", "/scripts/tsconfig-node.json", "/scripts/deploy.ts", action, tempConfigPath, uniqueId];
  } else {
    command = ["yarn", "ts-node", "--project", "/scripts/tsconfig-node.json", "/scripts/deploy.ts", action, deploymentName, uniqueId];
  }

  return [command, tempConfigPath];
};

// POST request for deploy
app.post("/deploy", async (req, res) => {
  const { config, deploymentName, uniqueId } = req.body;
  const streamLogs = req.query.streamLogs === 'true';
  if ((!config && !deploymentName) || !uniqueId) {
    log("Invalid deploy request received. Missing parameters.");
    return res.status(400).json({ error: "Invalid request. Provide a complete configuration or a deployment name, and a unique ID." });
  }

  const [command, tempConfigPath] = prepareCommand("deploy", config, deploymentName, uniqueId);
  log(`Deployment initiated for unique ID: ${uniqueId}`);
  handleCommandExecution(command, res, tempConfigPath, streamLogs);
});

// POST request for remove
app.post("/remove", async (req, res) => {
  const { config, deploymentName, uniqueId } = req.body;
  const streamLogs = req.query.streamLogs === 'true';
  if ((!config && !deploymentName) || !uniqueId) {
    log("Invalid remove request received. Missing parameters.");
    return res.status(400).json({ error: "Invalid request. Provide a complete configuration or a deployment name, and a unique ID." });
  }

  const [command, tempConfigPath] = prepareCommand("remove", config, deploymentName, uniqueId);
  log(`Removal initiated for unique ID: ${uniqueId}`);
  handleCommandExecution(command, res, tempConfigPath, streamLogs);
});

// POST request for info
app.post("/info", async (req, res) => {
  const { config, deploymentName, uniqueId } = req.body;
  const streamLogs = req.query.streamLogs === 'true';
  if ((!config && !deploymentName) || !uniqueId) {
    log("Invalid info request received. Missing parameters.");
    return res.status(400).json({ error: "Invalid request. Provide a complete configuration or a deployment name, and a unique ID." });
  }

  const [command, tempConfigPath] = prepareCommand("info", config, deploymentName, uniqueId);
  log(`Info retrieval initiated for unique ID: ${uniqueId}`);
  handleCommandExecution(command, res, tempConfigPath, streamLogs);
});

// POST request for getVM
app.post("/getVM", async (req, res) => {
  const { config, deploymentName, uniqueId } = req.body;
  const streamLogs = req.query.streamLogs === 'true';
  if ((!config && !deploymentName) || !uniqueId) {
    log("Invalid getVM request received. Missing parameters.");
    return res.status(400).json({ error: "Invalid request. Provide a complete configuration or a deployment name, and a unique ID." });
  }

  const [command, tempConfigPath] = prepareCommand("getVM", config, deploymentName, uniqueId);
  log(`VM retrieval initiated for unique ID: ${uniqueId}`);
  handleCommandExecution(command, res, tempConfigPath, streamLogs);
});

// POST request for getGw
app.post("/getGw", async (req, res) => {
  const { config, deploymentName, uniqueId } = req.body;
  const streamLogs = req.query.streamLogs === 'true';
  if ((!config && !deploymentName) || !uniqueId) {
    log("Invalid getGw request received. Missing parameters.");
    return res.status(400).json({ error: "Invalid request. Provide a complete configuration or a deployment name, and a unique ID." });
  }

  const [command, tempConfigPath] = prepareCommand("getGw", config, deploymentName, uniqueId);
  log(`Gateway retrieval initiated for unique ID: ${uniqueId}`);
  handleCommandExecution(command, res, tempConfigPath, streamLogs);
});

// POST request for getWg
app.post("/getWg", async (req, res) => {
  const { config, deploymentName, uniqueId } = req.body;
  const streamLogs = req.query.streamLogs === 'true';
  if ((!config && !deploymentName) || !uniqueId) {
    log("Invalid getWg request received. Missing parameters.");
    return res.status(400).json({ error: "Invalid request. Provide a complete configuration or a deployment name, and a unique ID." });
  }

  const [command, tempConfigPath] = prepareCommand("getWg", config, deploymentName, uniqueId);
  log(`WireGuard config retrieval initiated for unique ID: ${uniqueId}`);
  handleCommandExecution(command, res, tempConfigPath, streamLogs);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
});
