import {Router} from "express";
import {createRule,getRules,updateRule,deleteRule} from "../controller/rule.controller.js";

const router = Router();

router.post("/steps/:step_id/rules", createRule);
router.get("/steps/:step_id/rules", getRules);
router.put("/rules/:id", updateRule);
router.delete("/rules/:id", deleteRule);

export default router;