import express from "express";
import cors from "cors";
import { PORT } from "./config/env.js";
import pool from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

pool.connect().then(() => {
    console.log("Connected to the database");
  })
  .catch((err) => {
    console.error("Error connecting to the database", err);
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
