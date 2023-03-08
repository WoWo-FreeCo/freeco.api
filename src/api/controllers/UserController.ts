import { CookieOptions, NextFunction, Request, Response } from 'express';
import UserService, { MemberLevel } from '../services/UserService';
import { number, object, ObjectSchema, string, ValidationError } from 'yup';
import httpStatus from 'http-status';
import bcrypt from 'bcrypt';
import jwt from '../../utils/jwt';
import config from 'config';
import { Pagination } from '../../utils/helper/pagination';
import BonusPointService from '../services/BonusPointService';
import userController from './UserController';
import UserActivityService from '../services/UserActivityService';
import MailgunService from '../services/MailgunService';

interface RegisterBody {
  email: string;
  password: string;
  nickname?: string;
  cellphone: string;
  telephone?: string;
  addressOne: string;
  addressTwo?: string;
  addressThree?: string;
  // Note: 推薦帳號
  recommendedAccount?: string;
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
  recommendedAccount: string().optional(),
});

interface UpdateUserInfoBody {
  email: string;
  nickname?: string;
  cellphone: string;
  telephone?: string;
  addressOne: string;
  addressTwo?: string;
  addressThree?: string;
}

const updateUserInfoSchema: ObjectSchema<UpdateUserInfoBody> = object({
  email: string().email().required(),
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

interface ForgotPasswordBody {
  email: string;
}

const forgotPasswordSchema: ObjectSchema<ForgotPasswordBody> = object({
  email: string().email().required(),
});

interface ResetPasswordBody {
  email: string;
  password: string;
}

const resetPasswordSchema: ObjectSchema<ResetPasswordBody> = object({
  email: string().required(),
  password: string().required(),
});

type GetManyProfileQuery = Pagination;
const getManyProfileQuerySchema: ObjectSchema<GetManyProfileQuery> = object({
  take: number().min(0).max(200).default(10).optional(),
  skip: number().min(0).default(0).optional(),
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
  memberLevel: MemberLevel | null;
  YouTubeChannelActivated: boolean | null;
  FacebookGroupActivated: boolean | null;
  IGFollowActivated: boolean | null;
  VIPActivated: boolean | null;
  SVIPActivated: boolean | null;
}

// Note:
// Cookie options, default access token is 1 minute and refresh token is 30 minutes
const accessTokenExpiresIn = config.has('ACCESS_TOKEN_EXPIRES_IN')
  ? config.get<number>('ACCESS_TOKEN_EXPIRES_IN')
  : 1;
const refreshTokenExpiresIn = config.has('REFRESH_TOKEN_EXPIRES_IN')
  ? config.get<number>('REFRESH_TOKEN_EXPIRES_IN')
  : 30;
const accessTokenCookieOptions: CookieOptions = {
  expires: new Date(Date.now() + accessTokenExpiresIn * 60 * 1000),
  maxAge: accessTokenExpiresIn * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
};

// const refreshTokenCookieOptions: CookieOptions = {
//   expires: new Date(Date.now() + refreshTokenExpiresIn * 60 * 1000),
//   maxAge: refreshTokenExpiresIn * 60 * 1000,
//   httpOnly: true,
//   sameSite: 'lax',
// };

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
      // Note: Check email or cellphone is used
      if (await UserService.getUserByEmail({ ...registerBody })) {
        res.status(httpStatus.CONFLICT).send({
          message: 'Email is already used.',
        });
        return;
      }
      if (await UserService.getUserByCellphone({ ...registerBody })) {
        res.status(httpStatus.CONFLICT).send({
          message: 'Cellphone is already used.',
        });
        return;
      }

      // Note: Auto-gen a `Salt` and hash password
      const hashedPassword = await bcrypt.hash(registerBody.password, 10);

      // Note: Create user
      const user = await UserService.createUser({
        ...registerBody,
        password: hashedPassword,
      });

      // Note: 推薦帳號，使用綁定VIP推薦人
      if (registerBody.recommendedAccount) {
        await UserActivityService.activateUserActivity({
          userId: user.id,
          kind: 'VIP',
          code: registerBody.recommendedAccount,
        });
      }

      // Send register bonus points
      await BonusPointService.gainFromRegisterMembership(user.id);

      // 生成加密 email 值
      const hashData = await MailgunService.encodeEmail({
        email: registerBody.email,
      });

      const host = config.get<string>('HOST');
      const apiPort = config.get<string>('API_PORT');
      const link = `${host}:${apiPort}/api/v1/mail/validation-email?email=${hashData}`;
      const details = {
        from: `${config.get<string>(
          'CLIENT_HOST_NAME',
        )} <info@${config.get<string>('MAILGUN_DOMAIN')}>`,
        subject: `${config.get<string>('CLIENT_HOST_NAME')}-驗證信箱連結`,
        html: `
        <html>
        <h1>點擊連結驗證信箱</h1>
           <a href="${link}">${link}</a>
       </html>
        `,
      };
      // 發送信件
      await MailgunService.sendEmail({
        email: registerBody.email,
        hashData,
        details,
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

      // Note: Sign (new) access token and refresh token
      const accessToken = jwt.sign(
        {
          sub: {
            id: user.id,
          },
        },
        'ACCESS_TOKEN_PRIVATE_KEY',
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
        'REFRESH_TOKEN_PRIVATE_KEY',
        {
          expiresIn: `${refreshTokenExpiresIn}m`,
        },
      );

      res.cookie('logged_in', true, {
        ...accessTokenCookieOptions,
        httpOnly: false,
      });

      res.status(httpStatus.OK).json({
        data: {
          accessToken,
          refreshToken,
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
    // Note: Check refresh token request req.headers.authorization
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.includes('Bearer')) {
      res.sendStatus(httpStatus.UNAUTHORIZED);
      return;
    }
    const currentRefreshToken = authorization.slice(7);

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
      }>(currentRefreshToken, 'REFRESH_TOKEN_PUBLIC_KEY');
      if (!decoded) {
        res.status(httpStatus.UNAUTHORIZED).send({
          message: failMessage,
        });
        return;
      }

      // Note: Check user exists
      const user = await UserService.getUserById({ ...decoded.sub });
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
        'ACCESS_TOKEN_PRIVATE_KEY',
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
        'REFRESH_TOKEN_PRIVATE_KEY',
        {
          expiresIn: `${refreshTokenExpiresIn}m`,
        },
      );

      res.cookie('logged_in', true, {
        ...accessTokenCookieOptions,
        httpOnly: false,
      });

      res.status(httpStatus.OK).json({
        data: {
          accessToken,
          refreshToken,
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
      const user = await UserService.getUserProfileById({ id });

      if (user && user.activation) {
        const memberLevel = UserService.getUserMemberLevel({
          activation: user.activation,
        });

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
          YouTubeChannelActivated: user.activation
            ? user.activation.YouTubeChannelActivated
            : null,
          FacebookGroupActivated: user.activation
            ? user.activation.FacebookGroupActivated
            : null,
          IGFollowActivated: user.activation
            ? user.activation.IGFollowActivated
            : null,
          VIPActivated: user.activation ? user.activation.VIPActivated : null,
          SVIPActivated: user.activation ? user.activation.SVIPActivated : null,
          memberLevel,
        };

        res.status(httpStatus.OK).json({ data: profile });
      } else {
        res.sendStatus(httpStatus.NOT_FOUND);
      }
    } catch (err) {
      next(err);
    }
  }

  async updateUserInfo(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let updateUserInfoBody: UpdateUserInfoBody;
    try {
      // Note: Check request body is valid
      updateUserInfoBody = await updateUserInfoSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    try {
      const { id } = req.userdata;
      // Note: Check email or cellphone is used
      let user = await UserService.getUserByEmail({
        email: updateUserInfoBody.email,
      });
      if (user && user.id !== id) {
        res.status(httpStatus.CONFLICT).send({
          message: 'Email is already used.',
        });
        return;
      }
      user = await UserService.getUserByCellphone({
        cellphone: updateUserInfoBody.cellphone,
      });
      if (user && user.id !== id) {
        res.status(httpStatus.CONFLICT).send({
          message: 'Cellphone is already used.',
        });
        return;
      }
      user = await UserService.updateUser({
        id,
        email: updateUserInfoBody.email,
        nickname: updateUserInfoBody.nickname,
        cellphone: updateUserInfoBody.cellphone,
        telephone: updateUserInfoBody.telephone,
        addressOne: updateUserInfoBody.addressOne,
        addressTwo: updateUserInfoBody.addressTwo,
        addressThree: updateUserInfoBody.addressThree,
      });

      if (!user) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
          message:
            'Could not update user basic info correctly. Please try it later.',
        });
        return;
      }
      await userController.getProfile(req, res, next);
    } catch (err) {
      next(err);
    }
  }
  async getManyProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let getManyProfileQuery: GetManyProfileQuery;
    try {
      // Note: Check request query is valid
      getManyProfileQuery = await getManyProfileQuerySchema.validate(req.query);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const users = await UserService.getUsers({
        pagination: { ...getManyProfileQuery },
      });
      let anyUserMissActivation = false;
      const responseData: ProfileResponse[] = users.map((user) => {
        let memberLevel: MemberLevel | null = null;
        if (user.activation) {
          memberLevel = UserService.getUserMemberLevel({
            activation: user.activation,
          });
        } else {
          anyUserMissActivation = true;
        }
        return {
          id: user.id,
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
          YouTubeChannelActivated:
            user.activation !== null
              ? user.activation.YouTubeChannelActivated
              : null,
          FacebookGroupActivated:
            user.activation !== null
              ? user.activation.FacebookGroupActivated
              : null,
          IGFollowActivated:
            user.activation !== null ? user.activation.IGFollowActivated : null,
          VIPActivated:
            user.activation !== null ? user.activation.VIPActivated : null,
          SVIPActivated:
            user.activation !== null ? user.activation.SVIPActivated : null,
          memberLevel,
        };
      });
      if (anyUserMissActivation) {
        res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR).json({
          data: {
            message: 'One (or more) does not have complete profile data.',
          },
        });
      } else {
        res.status(httpStatus.OK).json({ data: responseData });
      }
    } catch (err) {
      next(err);
    }
  }

  /**
   * 忘記密碼
   */
  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const forgotPasswordBody: ForgotPasswordBody =
        await forgotPasswordSchema.validate(req.body);
      const hashData = await MailgunService.encodeEmail({
        email: forgotPasswordBody.email,
      });
      const host = config.get<string>('CLIENT_HOST');
      const link = `${host}/forget?email=${hashData}`;
      const details = {
        from: `${config.get<string>(
          'CLIENT_HOST_NAME',
        )} <info@${config.get<string>('MAILGUN_DOMAIN')}>`,
        subject: `${config.get<string>('CLIENT_HOST_NAME')}-驗證信箱連結`,
        html: `
      <html>
      <h1>點擊連結重設密碼</h1>
         <a href="${link}">${link}</a>
     </html>
      `,
      };
      await MailgunService.sendEmail({
        email: forgotPasswordBody.email,
        hashData,
        details,
      });
      res.status(httpStatus.OK).json({ msg: '重置密碼信件發送成功' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 重設密碼
   */
  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const resetPasswordBody: ResetPasswordBody =
        await resetPasswordSchema.validate(req.body);
      // 解密 email
      const email = await MailgunService.decipherEmail({
        hashValue: resetPasswordBody.email,
      });
      // 透過 email 取得使用者資料
      const user = await UserService.getUserByEmail({ email });
      if (user === null) {
        res.status(httpStatus.NOT_FOUND).json({ msg: 'User not found.' });
        return;
      }
      await UserService.resetPassword({
        email,
        password: resetPasswordBody.password,
      });
      res.status(httpStatus.OK).json({ msg: '重置密碼成功' });
    } catch (err) {
      next(err);
    }
  }
}

export default new UserController();
