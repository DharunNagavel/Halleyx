import { Router } from "express";
import { Sigin, Signup } from "../controller/auth.controller.js";

const router = Router();

router.post("/signin",Sigin);
router.post("/signup",Signup);

export default router;