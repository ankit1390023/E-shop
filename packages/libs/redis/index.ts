import Redis from "ioredis"

console.log(process.env.REDIS_URL);
export const redis = new Redis(process.env.REDIS_URL!); //here this ! will promise REDIS_URL is not undefined 
