import { ValidationError } from "../../../../packages/error-handler";
import { randomInt } from 'crypto';
import { redis } from "../../../../packages/libs/redis";
import { sendEmail } from "./sendMail";
import { NextFunction } from "express";


const isValidEmail=(email:string)=>{
    const emailRegex=/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return typeof email === 'string' && emailRegex.test(email);
}
export const validaterRegistrationData = (data:any,userType:"user"|"seller") => {
    const {name,email,password,phone_number,country}=data;
    if(!name||!email||!password||(userType==="seller" && (!phone_number && !country))){
        throw new ValidationError("Missing required fields!");
    }
    if(!isValidEmail(email)){
        throw new ValidationError("Invalid email format!");
    }
}

export const checkOtpRestrictions=async(
    email: string,
    next: NextFunction
) => {
    if (await redis.get(`otp_lock:${email}`)) {
        return next(new ValidationError("Account locked due to multiple failed attempts! Try again after 30 minutes"));
    }
    if (await redis.get(`otp_spam_lock:${email}`)) {
        return next(new ValidationError("Too many OTP requests! Please wait 1-hour before requesting again."));
    }
    if (await redis.get(`otp_cooldown:${email}`)) {
        return next(new ValidationError("Please wait 1-minute before requesting a new OTP"))
    }
}

export const trackOtpRequests = async(
    email: string,
    next: NextFunction
) => {
    const otpRequestKey = `otp_request_count:${email}`;
    let otpRequests = parseInt((await redis.get(otpRequestKey)) || "0");
    if (otpRequests >= 2) {
        await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600);//lock for 1-hour
        return next(new ValidationError("Too many OTP requests.Please wait 1 hour before requesting again."))
    }
     await redis.set(otpRequestKey, otpRequests + 1, "EX", 3600); //tarcking req for 1-hour
        
}

export const sendOtp = async (
    name: string,
    email: string,
    template: string
   ) => {
    const otp = randomInt(1000, 9999).toString();
    await sendEmail(email,"Verify you Email",template,{name,otp});
    await redis.set(`otp:${email}`, otp, "EX", 300); //300sec=5 min
    await redis.set(`otp_cooldown:${email}`, "true", "EX", 60);  // 60sec=1min
}