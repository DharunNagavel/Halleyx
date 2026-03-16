import {Router} from "express";
import {executeWorkflow,getExecution,cancelExecution,retryExecution,respondToApproval,getAllExecutions} from "../controller/execution.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/workflows/:workflow_id/execute", executeWorkflow);
router.get("/executions", getAllExecutions);
router.get("/executions/:id", getExecution);
router.post("/executions/:id/cancel", cancelExecution);
router.post("/executions/:id/retry", retryExecution);
router.post("/executions/:id/respond", respondToApproval);

export default router;