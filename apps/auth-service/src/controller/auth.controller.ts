import { NextFunction,Request,Response} from "express";
import { validaterRegistrationData } from "../utils/auth.helper";

//Register a new user
export const userRegistration = async (req:Request,res:Response,next:NextFunction) => {
    validaterRegistrationData(req.body, "user");
    
}