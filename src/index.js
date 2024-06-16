"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const deploy_1 = require("./deploy");
const app = (0, express_1.default)();
const port = 3000;
app.use(body_parser_1.default.json());
app.post("/api/mining/create", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { deploymentNameOrPath, instanceId } = req.body;
        const result = yield (0, deploy_1.deploy)(deploymentNameOrPath, instanceId);
        res.status(201).json({
            message: "Node created successfully",
            output: result,
        });
    }
    catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
}));
app.post("/api/mining/remove", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { deploymentNameOrPath, instanceId } = req.body;
        yield (0, deploy_1.remove)(deploymentNameOrPath, instanceId);
        res.status(200).json({
            message: "Node removed successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
}));
app.get("/api/mining/info", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { deploymentNameOrPath, instanceId } = req.query;
        const result = yield (0, deploy_1.getInfo)(deploymentNameOrPath, instanceId);
        res.status(200).json({
            message: "Node info retrieved successfully",
            output: result,
        });
    }
    catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
}));
app.listen(port, () => {
    console.log(`Server running at http://0.0.0.0:${port}/`);
});
