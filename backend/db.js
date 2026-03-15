import { Pool } from "pg";
import { DB_URL } from "./config/env.js";

const pool = new Pool(
    {
        connectionString:DB_URL,
        ssl: { rejectUnauthorized: false },
    }); 

export default pool;