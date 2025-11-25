import jwt from 'jsonwebtoken';

export const genAccessAndRefreshToken = async (payload: Record<string, any>) => {
    
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET as string, {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY as jwt.SignOptions['expiresIn'],
    });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET as string, {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY as jwt.SignOptions['expiresIn'],
    });
    
    return { accessToken, refreshToken };
};

