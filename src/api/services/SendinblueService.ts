import SibApiV3Sdk from 'sib-api-v3-sdk';
import config from 'config';
import httpStatus from 'http-status';

/**
 * 使用 sendinblue 第三方發郵件機制
 * 範例文檔
 * https://developers.sendinblue.com/recipes/send-transactional-emails-in-nodejs
 */
class SendinBlueService {
  async sendEmail(data: {
    email: string;
    hashData: string;
    details: { html: string; subject: string };
  }): Promise<string | unknown | { statusCode: number; send: unknown }> {
    // sendinblue init
    SibApiV3Sdk.ApiClient.instance.authentications['api-key'].apiKey =
      config.get('SENDINBLUE_KEY');
    // 發送訊息格式
    const sendData = {
      to: data.email,
      subject: data.details.subject,
      html: data.details.html,
    };
    try {
      await new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail({
        subject: sendData.subject,
        sender: {
          email: `info@${config.get('MAIL_DOMAIN')}`,
          name: config.get('CLIENT_HOST_NAME'),
        },
        to: [{ email: sendData.to }],
        htmlContent: sendData.html,
      });
      return '郵件發送成功';
    } catch (err) {
      throw {
        statusCode: httpStatus.BAD_REQUEST,
        send: { message: '郵件發送失敗' },
      };
    }
  }
}

export default new SendinBlueService();
