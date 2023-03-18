import axios from 'axios';
import prisma from '../../../database/client/prisma/index';
import { FacebookUser, User } from '@prisma/client';
// import config from 'config';
import { IFacebookUserInfo } from './interface';
import UserService from '../userService/index';
import httpStatus from 'http-status';
export class FacebookUserService {
  /**
   * 使用 asid 取得 facebook user
   * @param data
   * @returns
   */
  async getUserByAsid(data: {
    asid: string;
  }): Promise<(FacebookUser & { user: User | null }) | null> {
    const user = await prisma.facebookUser.findFirst({
      where: {
        asid: data.asid,
      },
      include: {
        user: true,
      },
    });
    return user;
  }

  /**
   * web 端驗證 access token 是否有效
   * @param { type Object(物件) } data
   * @example {
   *  accessToken: 驗證token { type String(字串) }
   * }
   * @returns
   */
  async authenticate(data: {
    accessToken: string;
  }): Promise<{ success: boolean; payload: IFacebookUserInfo } | any> {
    try {
      const { data: facebookUser } = await axios.get(
        `https://graph.facebook.com/me?access_token=${data.accessToken}`,
        {
          params: {
            fields: [
              'id',
              'email',
              'name',
              'first_name',
              'middle_name',
              'last_name',
              'picture',
            ].join(','),
            access_token: encodeURIComponent(data.accessToken),
          },
        },
      );
      return { success: true, payload: facebookUser };
    } catch (err) {
      return { success: false, err: err };
    }
  }

  /**
   * 新增或更新
   * @param data
   * @returns
   */
  async createOrUpdate(data: {
    accessToken: string;
    recommendedAccount?: string;
  }): Promise<{ statusCode: number; send: any } | void> {
    // 驗證 facebook 登入 並回傳使用者資料
    const oauthInfo = await this.authenticate({
      accessToken: data.accessToken,
    });
    // 驗證失敗不往下執行
    if (!oauthInfo.success) {
      throw {
        statusCode: httpStatus.BAD_REQUEST,
        send: { message: 'Facebook Authenticate Fail.' },
      };
    }
    // 取得 facebook 表資料
    const facebookUser =
      oauthInfo.payload.id !== undefined
        ? await prisma.facebookUser.findFirst({
            where: {
              asid: oauthInfo.payload.id,
            },
          })
        : null;
    // 取得 user 表資料
    const user = await UserService.getUserByEmail({
      email: oauthInfo.payload.email,
    });
    // 判斷有無 facebookUser 與 user 資料
    if (facebookUser === null && user === null) {
      // 註冊使用者
      try {
        // Note: Create user
        await UserService.registerBySocialMedia({
          email: oauthInfo.payload.email,
          nickname: oauthInfo.payload.name,
          addressOne: '',
          recommendedAccount: data.recommendedAccount ?? undefined,
        });
      } catch (err) {
        throw {
          statusCode: httpStatus.BAD_REQUEST,
          send: { message: 'Create User Fail.' },
        };
      }
      // 透過信箱取得使用者資料
      const user = await UserService.getUserByEmail({
        email: oauthInfo.payload.email,
      });
      if (user === null) {
        throw {
          statusCode: httpStatus.BAD_REQUEST,
          send: { message: 'User not found.' },
        };
      }
      try {
        // 新增 facebook user 綁定
        await this.create({ ...oauthInfo.payload }, user!.id);
      } catch (err) {
        throw {
          statusCode: httpStatus.BAD_REQUEST,
          send: { message: 'Create Facebook User Fail.' },
        };
      }
    } else if (
      /* 判斷有 facebookUser 和 user 資料 但 userId 為空的情況 */
      facebookUser !== null &&
      user !== null &&
      facebookUser.userId === null
    ) {
      // 更新 facebook user 綁定
      try {
        await this.update({ ...oauthInfo.payload }, user.id);
      } catch (err) {
        throw {
          statusCode: httpStatus.BAD_REQUEST,
          send: { message: 'Update Facebook User Fail.' },
        };
      }
    } else if (facebookUser === null && user !== null) {
      try {
        // 新增 facebook user 綁定
        await this.create({ ...oauthInfo.payload }, user!.id);
      } catch (err) {
        throw {
          statusCode: httpStatus.BAD_REQUEST,
          send: { message: 'Create Facebook User Fail.' },
        };
      }
    }
    if (facebookUser !== null && user !== null) {
      try {
        // 更新 facebook user 綁定
        await this.update({ ...oauthInfo.payload }, user.id);
      } catch (err) {
        throw {
          statusCode: httpStatus.BAD_REQUEST,
          send: { message: 'Update Facebook User Fail.' },
        };
      }
    }
  }

  /**
   * 新增
   */
  async create(data: any, userId: string): Promise<void | any> {
    try {
      await prisma.facebookUser.create({
        data: {
          asid: data.id,
          userId: userId,
          email: data.email,
          name: data.name,
          first_name: data.first_name,
          last_name: data.last_name,
          picture: data.picture.data.url,
          last_login_at: new Date(),
        },
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 更新
   */
  async update(data: any, userId: string): Promise<void | any> {
    try {
      await prisma.facebookUser.update({
        where: { email: data.email },
        data: {
          asid: data.id,
          userId: userId,
          email: data.email,
          name: data.name,
          first_name: data.first_name,
          last_name: data.last_name,
          picture: data.picture.data.url,
          last_login_at: new Date(),
        },
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
