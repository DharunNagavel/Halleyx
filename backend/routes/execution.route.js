import {Router} from "express";
import {executeWorkflow,getExecution,cancelExecution,retryExecution} from "../controller/execution.controller.js";

const router = Router();

router.post("/workflows/:workflow_id/execute", executeWorkflow);
router.get("/executions/:id", getExecution);
router.post("/executions/:id/cancel", cancelExecution);
router.post("/executions/:id/retry", retryExecution);

export default router;