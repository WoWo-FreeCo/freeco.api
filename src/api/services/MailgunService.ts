import config from 'config';
import mailgun from 'mailgun-js';
import crypto from 'crypto';
class MailgunService {
  async sendEmail(data: { email: string; hashData: string }) {
    // mailgun init
    const mg = mailgun({
      apiKey: config.get<string>('MAILGUN_KEY'),
      domain: config.get<string>('MAILGUN_DOMAIN'),
    });
    const host = config.get<string>('HOST');
    const apiPort = config.get<string>('API_PORT');
    console.log(
      `${host}:${apiPort}/api/v1/mail/vaildated-email?email=${data.hashData}`,
    );
    // <a href="
    // ${host}:${apiPort}/api/v1/mail/vaildated-email?email=${data.hashData}">${data.hashData}</a>

    // 發送訊息格式
    const sendData = {
      from: 'Mailgun Sandbox <postmaster@sandbox20569f297dab44b9b0b44e07a91dd3bd.mailgun.org>',
      to: data.email,
      subject: 'wowo驗證信箱',
      html: `
      <html>
        <h1>點擊連結驗證信箱</h1>
           <a href="${host}:${apiPort}/api/v1/mail/vaildated-email?email=${data.hashData}">${data.hashData}</a>
       </html>
      `,
    };
    try {
      await mg.messages().send(sendData);
      return '郵件發送成功';
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  /**
   * 生成 hash 過的 email
   */
  async createHashEmail(data: { email: string }): Promise<string> {
    const IV_LENGTH = 16;
    const algorithm = 'aes-256-cbc';
    const emailHashSecret = config.get<string>('EMAIL_HASH_SECRET');
    const iv = crypto.randomBytes(IV_LENGTH);
    // 加密規則 ase-256-cbc
    const cipher = crypto.createCipheriv(
      algorithm,
      Buffer.from(emailHashSecret),
      iv,
    );
    let encrypted = cipher.update(data.email);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    console.log(`未加密前：${data.email}`);
    console.log(
      '加密结果: ',
      iv.toString('hex') + ':' + encrypted.toString('hex'),
    );

    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  /**
   * 驗證簡訊驗證碼 crumb
   */
  async vaildateEmail(data: { hashValue: string }): Promise<boolean> {
    const textParts: any = data.hashValue.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const emailHashSecret = config.get<string>('EMAIL_HASH_SECRET');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(emailHashSecret),
      iv,
    );
    let decrypted: any = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}

export default new MailgunService();
