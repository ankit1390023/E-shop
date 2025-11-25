import { Response} from "express";

const options = {
        httpOnly: true, // Prevents client-side access to the cookie
        secure: true, // Use secure cookies in production
        sameSite: "strict" as const, // CSRF protection
        maxAge: 24 * 60 * 60 * 1000 // Cookie expiration time (e.g., 1 day)
};
    
export const setCookie = (res: Response, name: string, value: string) => {
    return res.cookie(name,value,options);
}