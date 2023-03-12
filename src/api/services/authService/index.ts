import jwt from '../../../utils/jwt';
// import * as jwtType from "@types/jsonwebtoken";
import { accessTokenExpiresIn, refreshTokenExpiresIn } from './AuthConfig';
class AuthService {
  /**
   * 創建 accessToken
   * @param data
   * @returns
   */
  ceateAccessToken(data: { userId: string }): string {
    return jwt.sign(
      {
        sub: {
          id: data.userId,
        },
      },
      'ACCESS_TOKEN_PRIVATE_KEY',
      {
        expiresIn: `${accessTokenExpiresIn}m`,
      },
    );
  }
  /**
   * refresh token
   * @param data
   * @returns
   */
  refreshToken(data: { userId: string }): string {
    return jwt.sign(
      {
        sub: {
          id: data.userId,
        },
      },
      'REFRESH_TOKEN_PRIVATE_KEY',
      {
        expiresIn: `${refreshTokenExpiresIn}m`,
      },
    );
  }
}

export default new AuthService();
