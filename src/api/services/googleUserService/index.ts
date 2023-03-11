import prisma from '../../../database/client/prisma/index';
import { GoogleUser, User } from '@prisma/client';
import UserService from '../userService/index';
import { IGoogleUserInfo } from './interface';
import { OAuth2Client } from 'google-auth-library';
import moment from 'moment/moment';
import config from 'config';
import httpStatus from 'http-status';

export class GoogleUserService {
  public testA: string;
  public oauthClient: any;
  constructor(private a) {
    this.testA = this.a;

    this.oauthClient = new OAuth2Client(
      config.get('GOOGLE_CLIENT_ID'),
      config.get('GOOGLE_SECRET'),
    );
  }
  async getUserByAccountId(data: {
    accountId: string;
  }): Promise<(GoogleUser & { user: User | null }) | null> {
    const user = await prisma.googleUser.findFirst({
      where: {
        accountId: data.accountId,
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
  }): Promise<IGoogleUserInfo | any> {
    try {
      const ticket: any = await this.oauthClient.verifyIdToken({
        idToken: data.accessToken,
      });
      return { success: true, payload: ticket.payload };
    } catch (err) {
      return { success: false, err };
    }
  }

  /**
   * 新增或更新
   * @param data
   * @returns
   */
  async createOrUpdate(data: {
    accessToken: string;
  }): Promise<{ statusCode: number; send: any } | void> {
    // 驗證 google 登入 並回傳使用者資料
    const oauthInfo = await this.authenticate({
      accessToken: data.accessToken,
    });
    // 驗證失敗不往下執行
    if (oauthInfo.success) {
      return {
        statusCode: httpStatus.BAD_REQUEST,
        send: { message: 'Google Authenticate Fail' },
      };
    }
    // 取得 google users 表資料
    const googleUser = await prisma.googleUser.findFirst({
      where: {
        email: oauthInfo.email,
      },
    });
    // 取得 user 表資料
    const user = await UserService.getUserByEmail({ email: oauthInfo.email });
    // 判斷有無 googleUser 與 user 資料
    if (googleUser === null && user === null) {
      // 註冊使用者
      await UserService.register({
        email: oauthInfo.email,
        nickname: oauthInfo.nam,
        cellphone: '',
        addressOne: '',
      });
      // 透過信箱取得使用者資料
      const user = await UserService.getUserByEmail({ email: oauthInfo.email });
      // 新增 google user 綁定
      await this.create({ ...oauthInfo }, user!.id);
    } else if (
      googleUser !== null &&
      googleUser.userId === null &&
      user !== null
    ) {
      // 更新 google user 綁定
      await this.update({ ...oauthInfo }, user.id);
    }
    if (googleUser !== null && user !== null) {
      // 更新 google user 綁定
      await this.update({ ...oauthInfo }, user.id);
    }
  }

  /**
   * 新增
   */
  async create(data: IGoogleUserInfo, userId: string): Promise<void | any> {
    try {
      await prisma.googleUser.create({
        data: {
          accountId: data.id,
          userId: userId,
          email: data.email,
          family_name: data.family_name,
          given_name: data.given_name,
          locale: data.locale,
          picture: data.picture,
          last_login_at: moment().format('YYYY-MM-DD HH:mm:ss'),
        },
      });
    } catch (err) {
      return err;
    }
  }
  /**
   * 更新
   */
  async update(data: IGoogleUserInfo, userId: string): Promise<void | any> {
    try {
      await prisma.googleUser.update({
        where: { email: data.email },
        data: {
          accountId: data.id,
          userId: userId,
          email: data.email,
          family_name: data.family_name,
          given_name: data.given_name,
          locale: data.locale,
          picture: data.picture,
          last_login_at: moment().format('YYYY-MM-DD HH:mm:ss'),
        },
      });
    } catch (err) {
      return err;
    }
  }
}
