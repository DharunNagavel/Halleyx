import {config} from "dotenv";

config({path: ".env"});

export const{PORT,DB_URL,REDIS_URL,ARCJET,JWT_SECRET}=process.env;