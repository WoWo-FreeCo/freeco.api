import prisma from '../../../database/client/prisma';
import { ValidationError } from 'yup';
import { User, UserActivation } from '@prisma/client';
import { Pagination } from '../../../utils/helper/pagination';
import config from 'config';
import httpStatus from 'http-status';
import bcrypt from 'bcrypt';
import BonusPointService from '../BonusPointService';
import UserActivityService from '../UserActivityService';
import SendinBlueService from '../SendinblueService';
import { encodeEmail } from '../../utils/MailHelper';

import {
  IUserService,
  CreateUserInput,
  UpdateUserInfoInput,
  RegisterBody,
  SocialMediaRegisterBody,
  registerSchema,
  socialMediaRegisterSchema,
  MemberLevel,
} from './interface';

// export type MemberLevel = 'NORMAL' | 'VIP' | 'SVIP';

class UserService implements IUserService {
  static generateRecommendCode(): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    result += characters.charAt(Math.floor(Math.random() * characters.length));
    result += characters.charAt(Math.floor(Math.random() * characters.length));
    let counter = 0;
    while (counter < 7) {
      result += numbers.charAt(Math.floor(Math.random() * numbers.length));
      counter += 1;
    }
    return result;
  }
  async getUserByRecommendCode(data: {
    recommendCode: string;
  }): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: {
        recommendCode: data.recommendCode,
      },
    });
    return user;
  }

  async getUserByEmail(data: { email: string }): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        email: data.email,
      },
    });
    return user;
  }

  async getUserByCellphone(data: { cellphone: string }): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        cellphone: data.cellphone,
      },
    });
    return user;
  }
  async getUserByTaxIDNumber(data: {
    taxIDNumber: string;
  }): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        taxIDNumber: data.taxIDNumber,
      },
    });
    return user;
  }
  async getUserById(data: { id: string }): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        id: data.id,
      },
    });
    return user;
  }

  async getUserProfileById(data: {
    id: string;
  }): Promise<(User & { activation: UserActivation | null }) | null> {
    const user = await prisma.user.findFirst({
      where: {
        id: data.id,
      },
      include: {
        activation: true,
      },
    });
    return user;
  }

  async getUsers({
    pagination: { take, skip },
  }: {
    pagination: Pagination;
  }): Promise<(User & { activation: UserActivation | null })[]> {
    return prisma.user.findMany({
      include: {
        activation: true,
      },
      take,
      skip,
    });
  }
  async recommendByUser(data: {
    id: string;
    recommendInfo: { code: string };
  }): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: {
          recommendCode: data.recommendInfo.code,
        },
      });
      if (user) {
        const result = await prisma.user.update({
          where: {
            id: data.id,
          },
          data: {
            recommendedBy: user.id,
          },
        });
        return !!result;
      }
      return false;
    } catch (err) {
      return false;
    }
  }
  async createUser(data: CreateUserInput): Promise<User> {
    let recommendCode = UserService.generateRecommendCode();
    let repeatedRecommendCodeUser = prisma.user.findFirst({
      where: {
        recommendCode,
      },
    });
    while (!repeatedRecommendCodeUser) {
      recommendCode = UserService.generateRecommendCode();
      repeatedRecommendCodeUser = prisma.user.findFirst({
        where: {
          recommendCode,
        },
      });
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: data.password ?? null,
        nickname: data.nickname,
        cellphone: data.cellphone ?? null,
        telephone: data.telephone,
        rewardCredit: data.defaultReward || 0,
        activation: {
          create: {},
        },
        city: data.city,
        district: data.district,
        zipCode: data.zipCode,
        addressOne: data.addressOne,
        addressTwo: data.addressTwo,
        addressThree: data.addressThree,
        recommendCode,
      },
    });

    return user;
  }
  async updateUser(data: UpdateUserInfoInput): Promise<User | null> {
    try {
      return await prisma.user.update({
        where: {
          id: data.id,
        },
        data: {
          email: data.email,
          nickname: data.nickname,
          cellphone: data.cellphone,
          telephone: data.telephone,
          city: data.city,
          district: data.district,
          zipCode: data.zipCode,
          addressOne: data.addressOne,
          addressTwo: data.addressTwo,
          addressThree: data.addressThree,
        },
      });
    } catch (err) {
      return null;
    }
  }
  getUserMemberLevel(data: { activation: UserActivation }): MemberLevel {
    let memberLevel: MemberLevel = 'NORMAL';
    let count = 0;
    if (data.activation.FacebookGroupActivated) {
      count++;
    }
    if (data.activation.YouTubeChannelActivated) {
      count++;
    }
    if (data.activation.IGFollowActivated) {
      count++;
    }
    // Note: SVIP code completed or (綁定條件三選二）
    if (
      data.activation.VIPActivated &&
      (data.activation.SVIPActivated || count >= 2)
    ) {
      memberLevel = 'SVIP';
      // Note: VIP code completed and (綁定條件三選一）
    } else if (data.activation.VIPActivated && count >= 1) {
      memberLevel = 'VIP';
    }

    return memberLevel;
  }

  async incrementUserCredit(data: {
    userId: string;
    credit: number;
  }): Promise<void> {
    await prisma.user.update({
      where: {
        id: data.userId,
      },
      data: {
        rewardCredit: {
          increment: data.credit,
        },
      },
    });
  }

  /**
   * 更新信箱驗證時間
   */
  async vaildationUserEmail(data: { email: string }): Promise<void> {
    await prisma.user.update({
      where: {
        email: data.email,
      },
      data: {
        // 更新信箱啟用時間
        type: new Date(),
      },
    });
  }

  /**
   * 重置密碼
   */
  async resetPassword(data: {
    password: string;
    email: string;
  }): Promise<void> {
    // Note: Auto-gen a `Salt` and hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);
    await prisma.user.update({
      where: {
        email: data.email,
      },
      data: {
        password: hashedPassword,
      },
    });
  }

  /**
   * 註冊三方使用者
   */
  async registerBySocialMedia(
    data: SocialMediaRegisterBody,
  ): Promise<{ statusCode: number; send: any } | any> {
    /**
     * 表單驗證
     */
    let registerBody: SocialMediaRegisterBody;
    try {
      // Note: Check request body is valid
      registerBody = await socialMediaRegisterSchema.validate(data);
    } catch (err) {
      console.log(err);
      return {
        statusCode: httpStatus.BAD_REQUEST,
        send: (err as ValidationError).message,
      };
    }
    /** 表單驗證 end */

    try {
      // Note: Check email or cellphone is used
      if (await this.getUserByEmail({ ...registerBody })) {
        return {
          statusCode: httpStatus.CONFLICT,
          send: {
            message: 'Email is already used.',
          },
        };
      }
      // Note: Auto-gen a `Salt` and hash password

      // Note: Create user
      const user = await this.createUser({
        ...registerBody,
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
      const hashData = await encodeEmail({
        email: registerBody.email,
      });

      // api 網址
      const host = config.get<string>('HOST');
      // api port
      const apiPort = config.get<string>('API_PORT');
      // 信箱連結
      const link = `${host}:${apiPort}/api/v1/mail/validation-email?email=${hashData}`;
      // 信件內容
      const details = {
        subject: `${config.get<string>('CLIENT_HOST_NAME')}-驗證信箱連結`,
        html: `
          <html>
          <h1>點擊連結驗證信箱</h1>
             <a href="${link}">${link}</a>
          </html>
          `,
      };
      // 發送信件
      await SendinBlueService.sendEmail({
        email: registerBody.email,
        hashData,
        details,
      });
      return {
        statusCode: httpStatus.CREATED,
        send: { message: 'Register successful.' },
      };
    } catch (err) {
      return err;
    }
  }
  /**
   * 註冊使用者
   */
  async register(
    data: RegisterBody,
  ): Promise<{ statusCode: number; send: any } | any> {
    /**
     * 表單驗證
     */
    let registerBody: RegisterBody;
    try {
      // Note: Check request body is valid
      registerBody = await registerSchema.validate(data);
    } catch (err) {
      return {
        statusCode: httpStatus.BAD_REQUEST,
        send: (err as ValidationError).message.replace(' is a required field','為必填欄位') ,
      };
    }
    /** 表單驗證 end */

    try {
      // Note: Check email or cellphone is used
      if (await this.getUserByEmail({ ...registerBody })) {
        return {
          statusCode: httpStatus.CONFLICT,
          send: {
            message: '此Email已被使用',
          },
        };
      }
      if (await this.getUserByCellphone({ ...registerBody })) {
        return {
          statusCode: httpStatus.CONFLICT,
          send: { message: '此Cellphone已被使用' },
        };
      }

      // Note: Auto-gen a `Salt` and hash password

      const hashedPassword = await bcrypt.hash(registerBody.password, 10);
      // Note: Create user
      const user = await this.createUser({
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
      const hashData = await encodeEmail({
        email: registerBody.email,
      });

      // api 網址
      const host = config.get<string>('HOST');
      // api port
      const apiPort = config.get<string>('API_PORT');
      // 信箱連結
      const link = `${host}:${apiPort}/api/v1/mail/validation-email?email=${hashData}`;
      // 信件內容
      const details = {
        subject: `${config.get<string>('CLIENT_HOST_NAME')}-驗證信箱連結`,
        html: `
          <html>
          <h1>點擊連結驗證信箱</h1>
             <a href="${link}">${link}</a>
          </html>
          `,
      };
      // 發送信件
      await SendinBlueService.sendEmail({
        email: registerBody.email,
        hashData,
        details,
      });
      return {
        statusCode: httpStatus.CREATED,
        send: { message: '註冊成功' },
      };
    } catch (err) {
      return err;
    }
  }
}

export default new UserService();
