// src/index.ts
import express from "express";
import bodyParser from "body-parser";
import { deploy, remove, getInfo } from "./deploy";

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post("/api/mining/create", async (req, res) => {
  try {
    const { deploymentNameOrPath, instanceId } = req.body;
    const result = await deploy(deploymentNameOrPath, instanceId);
    res.status(201).json({
      message: "Node created successfully",
      output: result,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.post("/api/mining/remove", async (req, res) => {
  try {
    const { deploymentNameOrPath, instanceId } = req.body;
    await remove(deploymentNameOrPath, instanceId);
    res.status(200).json({
      message: "Node removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/api/mining/info", async (req, res) => {
  try {
    const { deploymentNameOrPath, instanceId } = req.query;
    const result = await getInfo(deploymentNameOrPath as string, instanceId as string);
    res.status(200).json({
      message: "Node info retrieved successfully",
      output: result,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
});

