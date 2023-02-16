import jwt, { SignOptions } from 'jsonwebtoken';
import config from 'config';
import Logger from '../logger';

class JWT {
  sign(
    payload: object,
    key: 'ACCESS_TOKEN_PRIVATE_KEY' | 'REFRESH_TOKEN_PRIVATE_KEY',
    options: SignOptions = {},
  ) {
    const secret = Buffer.from(config.get<string>(key), 'base64').toString(
      'ascii',
    );
    return jwt.sign(payload, secret, { ...options, algorithm: 'RS256' });
  }

  verify<T>(
    token: string,
    key: 'ACCESS_TOKEN_PUBLIC_KEY' | 'REFRESH_TOKEN_PUBLIC_KEY',
  ) {
    try {
      const publicKey = Buffer.from(config.get<string>(key), 'base64').toString(
        'ascii',
      );
      return jwt.verify(token, publicKey) as T;
    } catch (error) {
      console.log(error);
      Logger.error(error);
      return null;
    }
  }
}

export default new JWT();
