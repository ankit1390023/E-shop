import { ValidationError } from "../../../../packages/error-handler";




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