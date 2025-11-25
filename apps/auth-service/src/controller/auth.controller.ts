import { NextFunction, Request, Response } from "express";

import { prisma } from "../../../../packages/libs/prisma";
import { AuthError, ValidationError } from "../../../../packages/error-handler";
import bcrypt from "bcrypt";
import {
  checkOtpRestrictions,
  handleForgotPassword,
  sendOtp,
  trackOtpRequests,
  validaterRegistrationData,
  verifyForgotPasswordOtp,
  verifyOtp,
} from "../utils/auth.helper";
import { genAccessAndRefreshToken } from "../utils/token/genToken";
import { setCookie } from "../utils/cookies/setCookies";

//Register a new user
export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validaterRegistrationData(req.body, "user");
    const { name, email } = req.body;
    const existingUser = await prisma.users.findUnique({
      where: { email: email },
    });
    if (existingUser) {
      return next(new ValidationError("User already exists with this email"));
    }
    await checkOtpRestrictions(email);
    await trackOtpRequests(email);
    await sendOtp(name, email, "user-activation-mail");

    res.status(200).json({
      message: "OTP sent to mail! Please verify your account.",
    });
  } catch (error) {
    return next(error);
  }
};

//verify user with otp
export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, otp, password } = req.body;
    if (!name || !email || !otp || !password) {
      return next(new ValidationError("All fields are  required fields"));
    }
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return next(new ValidationError("User already exists with this email"));
    }
    await verifyOtp(email, otp);
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.users.create({
      data: { name, email, password: hashedPassword },
    });
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    return next(error);
  }
};
//login user
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ValidationError("Email and password are required!"));
    }
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (!existingUser) {
      return next(new AuthError("User does't exists"));
    }
    const isMatch = await bcrypt.compare(password, existingUser.password!);
    if (!isMatch) {
      return next(new AuthError("Invalid email or password"));
    }
    //generate access and refresh token
    const payload = {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
    };
    const { accessToken, refreshToken } = await genAccessAndRefreshToken(
      payload
    );

    setCookie(res, "accessToken", accessToken);
    setCookie(res, "refreshToken", refreshToken);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return next(error);
  }
};

//user forgot password
export const userForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await handleForgotPassword(req, res, next, "user");
};
//verify forgot-passord otp
export const verifyUserForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await verifyForgotPasswordOtp(req, res, next);
  } catch (error) {
    return next(error);
  }
};
//reset user-password
export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ValidationError("Email and new password are required"));
    }
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return next(new ValidationError("User not found"));

    //compare new password with existing
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) return next(new AuthError("Incorrect password!"));

    //hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    //update the user-data
    await prisma.users.update({
      where: { email },
      data: { password: hashedPassword },
    });
    return res.status(200).json({
      message: "Password reset successfull!",
    });
  } catch (error) {
    return next(error);
  }
};
