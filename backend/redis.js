import { createClient } from "redis";
import { REDIS_URL } from "./config/env.js";

const client = createClient({
  url: REDIS_URL
});

client.on("connect", () => {
  console.log("Redis Cloud connected");
});

client.on("error", (err) => {
  console.error("Redis error:", err);
});

export default client;