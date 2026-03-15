import express from "express";
import cors from "cors";
import { PORT } from "./config/env.js";
import pool from "./db.js";
import redis from "./redis.js";
import authRouter from "./routes/auth.route.js";
import workflowRoutes from "./routes/workflow.route.js";
import stepRoutes from "./routes/step.route.js";
import ruleRoutes from "./routes/rule.route.js";
import executionRoutes from "./routes/execution.route.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRouter);
app.use("/api/workflows", workflowRoutes);
app.use("/api", stepRoutes);
app.use("/api", ruleRoutes);
app.use("/api", executionRoutes);

pool
  .connect()
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((err) => {
    console.error("Error connecting to the database", err);
  });

redis
  .connect()
  .then(() => {
    console.log("Connected to Redis");
  })
  .catch((err) => {
    console.error("Error connecting to Redis", err);
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
