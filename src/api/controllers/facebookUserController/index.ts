import { FacebookUserService } from '../../services/facebookUserService/index';
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { LoginBody, loginSchema } from './FacebookUserControllerRequest';
import { ValidationError } from 'yup';
import { accessTokenCookieOptions } from '../../services/authService/AuthConfig';
import AuthService from '../../services/authService/index';
const facebookUserService = new FacebookUserService();
class FacebookUserController {
  /**
   * 登入
   * @param req
   * @param res
   * @param next
   * @returns
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    let loginBody: LoginBody;
    try {
      // Note: Check request body is valid
      loginBody = await loginSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    let facebookUser;
    try {
      // 驗證 google access token 是否有效
      facebookUser = await facebookUserService.authenticate(loginBody);
    } catch (err) {
      res
        .status(httpStatus.BAD_REQUEST)
        .send({ message: 'Google Authenticate Fail' });
    }
    try {
      // 創建或更新 facebookUser表 以及判斷是否建立 user 表
      await facebookUserService.createOrUpdate(loginBody);
      // 取得 google user 資料
      facebookUser = await facebookUserService.getUserByAsid({
        asid: facebookUser.payload.id,
      });

      // 判斷有資料時 回傳 jwt token
      if (facebookUser !== null) {
        // 將登入資訊寫入 cookie
        res.cookie('logged_in', true, {
          ...accessTokenCookieOptions,
          httpOnly: false,
        });
        // jwt token
        const accessToken = AuthService.ceateAccessToken({
          userId: facebookUser.user.id,
        });
        // refresh token
        const refreshToken = AuthService.refreshToken({
          userId: facebookUser.user.id,
        });

        res.status(httpStatus.OK).json({
          data: {
            user: facebookUser.user,
            accessToken,
            refreshToken,
          },
        });
      } else {
        res.status(httpStatus.NOT_FOUND).send({ message: 'User not found.' });
      }
    } catch (err: any) {
      if (err.statusCode !== undefined) {
        res.status(err.statusCode).send(err.send);
      }
      next(err);
    }
  }
}

export default new FacebookUserController();
