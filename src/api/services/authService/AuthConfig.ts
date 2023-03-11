import { CookieOptions } from 'express';
import config from 'config';
// Note:
// Cookie options, default access token is 1 minute and refresh token is 30 minutes
export const accessTokenExpiresIn = config.has('ACCESS_TOKEN_EXPIRES_IN')
  ? config.get<number>('ACCESS_TOKEN_EXPIRES_IN')
  : 1;
export const refreshTokenExpiresIn = config.has('REFRESH_TOKEN_EXPIRES_IN')
  ? config.get<number>('REFRESH_TOKEN_EXPIRES_IN')
  : 30;
export const accessTokenCookieOptions: CookieOptions = {
  expires: new Date(Date.now() + accessTokenExpiresIn * 60 * 1000),
  maxAge: accessTokenExpiresIn * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
};
