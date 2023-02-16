import { CookieOptions, NextFunction, Request, Response } from 'express';
import UserService from '../services/UserService';
import { object, ObjectSchema, string, ValidationError } from 'yup';
import httpStatus from 'http-status';
import bcrypt from 'bcrypt';
import jwt from '../../utils/jwt';
import config from 'config';

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

// Note:
// Cookie options, default access token is 12 hours and refresh token is 24 hours
const accessTokenExpiresIn = config.has('ACCESS_TOKEN_EXPIRES_IN')
  ? config.get<number>('ACCESS_TOKEN_EXPIRES_IN')
  : 12;
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
  static combineAddresses(data: {
    addressOne: string;
    addressTwo?: string;
    addressThree?: string;
  }) {
    const { addressOne, addressTwo, addressThree } = data;
    const addresses = [
      {
        address: addressOne,
      },
    ];
    if (addressTwo) {
      addresses.push({
        address: addressTwo,
      });
    }
    if (addressThree) {
      addresses.push({
        address: addressThree,
      });
    }
    return addresses;
  }

  async register(req: Request, res: Response, next: NextFunction) {
    let registerBody: RegisterBody;
    try {
      // Note: check request body is valid
      registerBody = await registerSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    try {
      // Note: check email is used
      let user = await UserService.getUserByEmail({ ...registerBody });
      if (user) {
        res.status(httpStatus.CONFLICT).send({
          message: 'Email is already used.',
        });
        return;
      }

      // Note: auto-gen a salt and hash password
      const hashedPassword = await bcrypt.hash(registerBody.password, 10);

      // Note: create user
      user = await UserService.createUser({
        ...registerBody,
        password: hashedPassword,
        addresses: UserController.combineAddresses({ ...registerBody }),
      });

      res.status(httpStatus.CREATED).send();
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    let loginBody: LoginBody;
    try {
      // Note: check request body is valid
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
      );
      const refreshToken = jwt.sign(
        {
          sub: {
            id: user.id,
          },
        },
        'REFRESH_TOKEN_PRIVATE_KEY',
      );

      // Note: Send access token in cookie
      res.cookie('access_token', accessToken, accessTokenCookieOptions);
      res.cookie('refresh_token', refreshToken, refreshTokenCookieOptions);
      res.cookie('logged_in', true, {
        ...accessTokenCookieOptions,
        httpOnly: false,
      });

      res.status(httpStatus.OK).json({
        accessToken,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new UserController();
