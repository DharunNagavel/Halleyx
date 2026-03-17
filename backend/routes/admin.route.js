import { Router } from "express";
import { getAdminStats, getAuditLogs } from "../controller/admin.controller.js";

const router = Router();

router.get("/stats", getAdminStats);
router.get("/audit-logs", getAuditLogs);

export default router;
