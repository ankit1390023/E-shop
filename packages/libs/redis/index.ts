import Redis from "ioredis"


export const redis = new Redis(process.env.REDIS_URL!); //here this ! will promise REDIS_URL is not undefined 
