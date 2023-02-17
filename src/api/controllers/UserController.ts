import { CookieOptions, NextFunction, Request, Response } from 'express';
import UserService from '../services/UserService';
import { object, ObjectSchema, string, ValidationError } from 'yup';
import httpStatus from 'http-status';
import bcrypt from 'bcrypt';
import jwt from '../../utils/jwt';
import config from 'config';
import userService from '../services/UserService';

interface RegisterBody {
  email: string;
  password: string;
  nickname?: string;
  cellphone: string;
  telephone?: string;
  addressOne: string;
  addressTwo?: string;
  addressThree?: string;
}

const registerSchema: ObjectSchema<RegisterBody> = object({
  email: string().email().required(),
  password: string().required(),
  nickname: string().optional(),
  cellphone: string().required(),
  telephone: string().optional(),
  addressOne: string().required(),
  addressTwo: string().optional(),
  addressThree: string().optional(),
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
  nickname: string | null;
  taxIDNumber: string | null;
  cellphone: string;
  telephone: string | null;
  addressOne: string;
  addressTwo: string | null;
  addressThree: string | null;
  rewardCredit: number;
  recommendCode: string;
  memberLevel: 'NORMAL' | 'VIP' | 'SVIP';
  YouTubeChannelActivated: boolean;
  FacebookGroupActivated: boolean;
}

// Note:
// Cookie options, default access token is 1 hour and refresh token is 24 hours
const accessTokenExpiresIn = config.has('ACCESS_TOKEN_EXPIRES_IN')
  ? config.get<number>('ACCESS_TOKEN_EXPIRES_IN')
  : 1;
const refreshTokenExpiresIn = config.has('REFRESH_TOKEN_EXPIRES_IN')
  ? config.get<number>('REFRESH_TOKEN_EXPIRES_IN')
  : 24;
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

class UserController {
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
      const user = await UserService.getUserByEmail({ ...registerBody });
      if (user) {
        res.status(httpStatus.CONFLICT).send({
          message: 'Email is already used.',
        });
        return;
      }

      // Note: Auto-gen a `Salt` and hash password
      const hashedPassword = await bcrypt.hash(registerBody.password, 10);

      // Note: Create user
      await UserService.createUser({
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
      const user = await UserService.getUserByEmail({ ...loginBody });
      if (!user || !(await bcrypt.compare(loginBody.password, user.password))) {
        res.status(httpStatus.UNAUTHORIZED).send({
          message: 'Invalid email or password.',
        });
        return;
      }

      // Note: Sign access token and refresh token
      const accessToken = jwt.sign(
        {
          sub: {
            id: user.id,
          },
        },
        'ACCESS_TOKEN_PRIVATE_KEY',
        {
          expiresIn: `${accessTokenExpiresIn}h`,
        },
      );
      const refreshToken = jwt.sign(
        {
          sub: {
            id: user.id,
          },
        },
        'REFRESH_TOKEN_PRIVATE_KEY',
        {
          expiresIn: `${refreshTokenExpiresIn}h`,
        },
      );

      // Note: Send access token in cookie
      res.cookie('access_token', accessToken, accessTokenCookieOptions);
      res.cookie('refresh_token', refreshToken, refreshTokenCookieOptions);
      res.cookie('logged_in', true, {
        ...accessTokenCookieOptions,
        httpOnly: false,
      });

      res.status(httpStatus.OK).json({
        data: {
          accessToken,
        },
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
    const refreshToken = req.cookies.refresh_token as string;

    const failMessage = 'Could not refresh token.';

    // Note: Check refresh token is included
    if (!refreshToken) {
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
      }>(refreshToken, 'REFRESH_TOKEN_PUBLIC_KEY');
      if (!decoded) {
        res.status(httpStatus.UNAUTHORIZED).send({
          message: failMessage,
        });
        return;
      }

      // Note: Check user exists
      const user = await userService.getUserById({ ...decoded.sub });
      if (!user) {
        res.status(httpStatus.UNAUTHORIZED).send({
          message: failMessage,
        });
        return;
      }

      // Note: Sign new access token
      const accessToken = jwt.sign(
        {
          sub: {
            id: user.id,
          },
        },
        'ACCESS_TOKEN_PRIVATE_KEY',
        {
          expiresIn: `${accessTokenExpiresIn}h`,
        },
      );

      // Note: Send access token in cookie
      res.cookie('access_token', accessToken, accessTokenCookieOptions);
      res.cookie('logged_in', true, {
        ...accessTokenCookieOptions,
        httpOnly: false,
      });

      res.status(200).json({
        data: { accessToken },
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
      const user = await userService.getUserProfileById({ id });

      if (user && user.activation) {
        let memberLevel: ProfileResponse['memberLevel'] = 'NORMAL';

        if (
          user.activation.SVIPActivated &&
          user.activation.FacebookGroupActivated &&
          user.activation.YouTubeChannelActivated
        ) {
          memberLevel = 'SVIP';
        } else if (
          user.activation.VIPActivated &&
          (user.activation.FacebookGroupActivated ||
            user.activation.YouTubeChannelActivated)
        ) {
          memberLevel = 'VIP';
        }

        const profile: ProfileResponse = {
          id,
          email: user.email,
          nickname: user.nickname || null,
          taxIDNumber: user.taxIDNumber,
          cellphone: user.cellphone,
          telephone: user.telephone,
          addressOne: user.addressOne,
          addressTwo: user.addressTwo,
          addressThree: user.addressThree,
          rewardCredit: user.rewardCredit,
          recommendCode: user.recommendCode,
          memberLevel,
          ...user.activation,
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

export default new UserController();
