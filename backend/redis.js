import { createClient } from "redis";
import { REDIS_URL } from "./config/env.js";

const redis = createClient({
    url: REDIS_URL
});

export default redis;