import {Router} from "express";
import {createWorkflow,getWorkflows,getWorkflowById,updateWorkflow,deleteWorkflow,getWorkflowVersions,rollbackWorkflow} from "../controller/workflow.controller.js";

const router = Router();

router.post("/", createWorkflow);
router.get("/", getWorkflows);
router.get("/:id", getWorkflowById);
router.put("/:id", updateWorkflow);
router.delete("/:id", deleteWorkflow);
router.get("/:id/versions", getWorkflowVersions);
router.post("/:id/rollback/:version", rollbackWorkflow);

export default router;
