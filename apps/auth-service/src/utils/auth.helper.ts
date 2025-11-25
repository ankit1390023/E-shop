import { ValidationError } from "../../../../packages/error-handler";
import { randomInt } from "crypto";
import { redis } from "../../../../packages/libs/redis";
import { sendEmail } from "./sendMail";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../../../../packages/libs/prisma";

const isValidEmail = (email: string) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return typeof email === "string" && emailRegex.test(email);
};

export const validaterRegistrationData = (
  data: any,
  userType: "user" | "seller"
) => {
  const { name, email, password, phone_number, country } = data;
  if (
    !name ||
    !email ||
    !password ||
    (userType === "seller" && !phone_number && !country)
  ) {
    throw new ValidationError("Missing required fields!");
  }
  if (!isValidEmail(email)) {
    throw new ValidationError("Invalid email format!");
  }
};

export const checkOtpRestrictions = async (email: string) => {
  if (await redis.get(`otp_lock:${email}`)) {
    throw new ValidationError(
      "Account locked due to multiple failed attempts! Try again after 30 minutes"
    );
  }
  if (await redis.get(`otp_spam_lock:${email}`)) {
    throw new ValidationError(
      "Too many OTP requests! Please wait 1-hour before requesting again."
    );
  }
  if (await redis.get(`otp_cooldown:${email}`)) {
    throw new ValidationError(
      "Please wait 1-minute before requesting a new OTP"
    );
  }
};

export const trackOtpRequests = async (email: string) => {
  const otpRequestKey = `otp_request_count:${email}`;
  let otpRequests = parseInt((await redis.get(otpRequestKey)) || "0");
  if (otpRequests >= 2) {
    await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600); //lock for 1-hour
    throw new ValidationError(
      "Too many OTP requests.Please wait 1 hour before requesting again."
    );
  }
  await redis.set(otpRequestKey, otpRequests + 1, "EX", 3600); //tarcking req for 1-hour
};

export const sendOtp = async (
  name: string,
  email: string,
  template: string
) => {
  const otp = randomInt(1000, 9999).toString();
  await sendEmail(email, "Verify you Email", template, { name, otp });
  await redis.set(`otp:${email}`, otp, "EX", 300); //300sec=5 min
  await redis.set(`otp_cooldown:${email}`, "true", "EX", 60); // 60sec=1min
};

export const verifyOtp = async (email: string, otp: string) => {
  const storedOtp = await redis.get(`otp:${email}`);
  if (!storedOtp) {
    throw new ValidationError("Invalid or expired OTP");
  }
  const failedAttemptKey = `otp_attempts:${email}`;
  const failedAttempts = parseInt((await redis.get(failedAttemptKey)) || "0");
  if (storedOtp != otp) {
    if (failedAttempts >= 2) {
      await redis.set(`otp_lock:${email}`, "locked", "EX", 1800); //lock for 30min
      await redis.del(`otp:${email}`, failedAttemptKey); //if account is locked don't need to unecessarity stored in redis db
      throw new ValidationError(
        "Too many failed attempts.Your account is locked for 30 minutes"
      );
    }
    await redis.set(failedAttemptKey, failedAttempts + 1, "EX", 300); //5 min me exp hoga
    throw new ValidationError(
      `Incorrect OTP, ${2 - failedAttempts} attempts left.`
    );
  }
  //if storedOtp == otp
  await redis.del(`otp:${email}`, failedAttemptKey);
};

export const handleForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
  userType: "user" | "seller"
) => {
  try {
    const { email } = req.body;
    if (!email) throw new ValidationError("Email is required");
    //find user/seller in db
    const user =
      userType === "user" &&
      (await prisma.users.findUnique({ where: { email } }));
    if (!user) throw new ValidationError(`${userType} not found`);

    //check otp restrictions
    await checkOtpRestrictions(email);
    await trackOtpRequests(email);

    //generate otp and send email
    await sendOtp(user.name, email, "forgot-password-user-email");

    res
      .status(200)
      .json({ message: "OTP sent to email.Please verify your account" });
  } catch (error) {
    return next(error);
  }
};

export const verifyForgotPasswordOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) throw new ValidationError("Email and OTP are required");
    await verifyOtp(email, otp);
    return res.status(200).json({
      message: "OTP verified successfully.You can reset your password",
    });
  } catch (error) {
    return next(error);
  }
};
