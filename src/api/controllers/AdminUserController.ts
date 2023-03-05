import { CookieOptions, NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { object, ObjectSchema, string, ValidationError } from 'yup';
import bcrypt from 'bcrypt';
import AdminUserService from '../services/AdminUserService';
import jwt from '../../utils/jwt';
import config from 'config';
import adminUserService from '../services/AdminUserService';

interface RegisterBody {
  email: string;
  password: string;
}

const registerSchema: ObjectSchema<RegisterBody> = object({
  email: string().email().required(),
  password: string().required(),
});

interface LoginBody {
  email: string;
  password: string;
}

const loginSchema: ObjectSchema<LoginBody> = object({
  email: string().email().required(),
  password: string().required(),
});

interface ProfileResponse {
  id: string;
  email: string;
}

// Note:
// Cookie options, default access token is 1 hour and refresh token is 24 hours
const accessTokenExpiresIn = config.has('ADMIN_ACCESS_TOKEN_EXPIRES_IN')
  ? config.get<number>('ADMIN_ACCESS_TOKEN_EXPIRES_IN')
  : 1;
const refreshTokenExpiresIn = config.has('ADMIN_REFRESH_TOKEN_EXPIRES_IN')
  ? config.get<number>('ADMIN_REFRESH_TOKEN_EXPIRES_IN')
  : 30;
const accessTokenCookieOptions: CookieOptions = {
  expires: new Date(Date.now() + accessTokenExpiresIn * 60 * 1000),
  maxAge: accessTokenExpiresIn * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
};
const refreshTokenCookieOptions: CookieOptions = {
  expires: new Date(Date.now() + refreshTokenExpiresIn * 60 * 1000),
  maxAge: refreshTokenExpiresIn * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
};

class AdminUserController {
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let registerBody: RegisterBody;
    try {
      // Note: Check request body is valid
      registerBody = await registerSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    try {
      // Note: Check email is used
      const user = await AdminUserService.getUserByEmail({ ...registerBody });
      if (user) {
        res.status(httpStatus.CONFLICT).send({
          message: 'Email is already used.',
        });
        return;
      }

      // Note: Auto-gen a `Salt` and hash password
      const hashedPassword = await bcrypt.hash(registerBody.password, 10);

      // Note: Create user
      await AdminUserService.createUser({
        ...registerBody,
        password: hashedPassword,
      });

      res.status(httpStatus.CREATED).send();
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    let loginBody: LoginBody;
    try {
      // Note: Check request body is valid
      loginBody = await loginSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const user = await AdminUserService.getUserByEmail({ ...loginBody });
      if (!user || !(await bcrypt.compare(loginBody.password, user.password))) {
        res.status(httpStatus.UNAUTHORIZED).send({
          message: 'Invalid email or password.',
        });
        return;
      }

      // Note: Sign (new) access token and refresh token
      const accessToken = jwt.sign(
        {
          sub: {
            id: user.id,
          },
        },
        'ADMIN_ACCESS_TOKEN_PRIVATE_KEY',
        {
          expiresIn: `${accessTokenExpiresIn}m`,
        },
      );
      const refreshToken = jwt.sign(
        {
          sub: {
            id: user.id,
          },
        },
        'ADMIN_REFRESH_TOKEN_PRIVATE_KEY',
        {
          expiresIn: `${refreshTokenExpiresIn}m`,
        },
      );

      // Note: Send (new) access token and refresh token in cookie
      res.cookie('access_token', accessToken, accessTokenCookieOptions);
      res.cookie('refresh_token', refreshToken, refreshTokenCookieOptions);
      res.cookie('logged_in', true, {
        ...accessTokenCookieOptions,
        httpOnly: false,
      });

      res.status(httpStatus.OK).json({
        data: { accessToken },
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const currentRefreshToken = req.cookies.refresh_token as string;

    const failMessage = 'Could not refresh token.';

    // Note: Check refresh token is included
    if (!currentRefreshToken) {
      res.status(httpStatus.UNAUTHORIZED).send({
        message: failMessage,
      });
      return;
    }

    try {
      // Note: Verify refresh token
      const decoded = jwt.verify<{
        sub: {
          id: string;
        };
      }>(currentRefreshToken, 'ADMIN_REFRESH_TOKEN_PUBLIC_KEY');
      if (!decoded) {
        res.status(httpStatus.UNAUTHORIZED).send({
          message: failMessage,
        });
        return;
      }

      // Note: Check user exists
      const user = await adminUserService.getUserById({ ...decoded.sub });
      if (!user) {
        res.status(httpStatus.UNAUTHORIZED).send({
          message: failMessage,
        });
        return;
      }

      // Note: Sign (new) access token and refresh token
      const accessToken = jwt.sign(
        {
          sub: {
            id: user.id,
          },
        },
        'ADMIN_ACCESS_TOKEN_PRIVATE_KEY',
        {
          expiresIn: `${accessTokenExpiresIn}m`,
        },
      );
      const refreshToken = jwt.sign(
        {
          sub: {
            id: user.id,
          },
        },
        'ADMIN_REFRESH_TOKEN_PRIVATE_KEY',
        {
          expiresIn: `${refreshTokenExpiresIn}m`,
        },
      );

      // Note: Send (new) access token and refresh token in cookie
      res.cookie('access_token', accessToken, accessTokenCookieOptions);
      res.cookie('refresh_token', refreshToken, refreshTokenCookieOptions);
      res.cookie('logged_in', true, {
        ...accessTokenCookieOptions,
        httpOnly: false,
      });

      res.status(200).json({
        data: {
          accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.userdata;
      const user = await adminUserService.getUserById({ id });

      if (user) {
        const profile: ProfileResponse = {
          id,
          email: user.email,
        };

        delete profile['userId'];

        res.status(httpStatus.OK).json({ data: profile });
      } else {
        res.sendStatus(httpStatus.NOT_FOUND);
      }
    } catch (err) {
      next(err);
    }
  }
}

export default new AdminUserController();
