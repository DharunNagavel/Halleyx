import {Router} from "express";
import {createStep,getSteps,updateStep,deleteStep} from "../controller/step.controller.js";

const router = Router();

router.post("/workflows/:workflow_id/steps", createStep);
router.get("/workflows/:workflow_id/steps", getSteps);
router.put("/steps/:id", updateStep);
router.delete("/steps/:id", deleteStep);

export default router;