import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt from '../../utils/jwt';

class AuthMiddleware {
  authenticate(type: 'user' | 'adminUser') {
    return async (req: Request, res: Response, next: NextFunction) => {
      const authorization = req.headers.authorization;
      if (!authorization || !authorization.includes('Bearer')) {
        res.sendStatus(httpStatus.UNAUTHORIZED);
        return;
      }

      const token = authorization.slice(7);
      const decoded = jwt.verify<{
        sub: {
          id: string;
        };
      }>(
        token,
        type == 'user'
          ? 'ACCESS_TOKEN_PUBLIC_KEY'
          : 'ADMIN_ACCESS_TOKEN_PUBLIC_KEY',
      );

      if (!decoded) {
        res.sendStatus(httpStatus.UNAUTHORIZED);
        return;
      }

      req.userdata = {
        id: decoded.sub.id,
      };

      next();
    };
  }
}

export default new AuthMiddleware();
