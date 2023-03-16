import { NextFunction, Request, Response } from 'express';
import UserService from '../services/userService/index';
import httpStatus from 'http-status';
import { decipherEmail, encodeEmail } from '../utils/MailHelper';
import SendinblueService from '../services/SendinblueService';
import config from 'config';
class SendinblueController {
  /**
   * 發送郵件
   */
  async sendEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const hashData = await encodeEmail({
        email: req.body.email,
      });
      const host = config.get<string>('HOST');
      const apiPort = config.get<string>('API_PORT');
      const link = `${host}:${apiPort}/api/v1/mail/validation-email?email=${hashData}`;
      const details = {
        subject: `${config.get<string>('CLIENT_HOST_NAME')}-驗證信箱連結`,
        html: `
        <html>
        <h1>點擊連結驗證信箱</h1>
           <a href="${link}">
            ${link}
           </a>
       </html>
        `,
      };
      const data = await SendinblueService.sendEmail({
        email: req.body.email,
        hashData: hashData,
        details,
      });
      res.status(httpStatus.OK).json({ msg: data });
    } catch (err: any) {
      if (err.statusCode !== undefined) {
        res.status(err.statusCode).send(err.send);
      } else {
        next(err);
      }
    }
  }

  /**
   * 解密 email 以及更新 email 驗證時間
   * @param req
   * @param res
   * @param next
   */
  async validationEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 解密信箱
      const email = await decipherEmail({
        hashValue: req.query.email as string,
      });
      // 確認信箱是否有使用者
      const user = await UserService.getUserByEmail({ email });
      if (user === null) {
        res.status(httpStatus.NOT_FOUND).send({
          message: 'Email not found',
        });
        return;
      }
      // 更新信箱驗證時間
      try {
        await UserService.vaildationUserEmail({
          email: email,
        });
      } catch (err) {
        // 更新信箱驗證時間失敗
        res.status(httpStatus.BAD_REQUEST).send({
          message: 'Update email validation failed',
        });
      }
      res
        .status(httpStatus.OK)
        .json({ email: user.email, msg: '驗證信箱成功' });
    } catch (err) {
      next(err);
    }
  }
}

export default new SendinblueController();
