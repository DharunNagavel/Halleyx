import {Router} from "express";
import {createWorkflow,getWorkflows,getWorkflowById,updateWorkflow,deleteWorkflow} from "../controller/workflow.controller.js";

const router = Router();

router.post("/", createWorkflow);
router.get("/", getWorkflows);
router.get("/:id", getWorkflowById);
router.put("/:id", updateWorkflow);
router.delete("/:id", deleteWorkflow);

export default router;
