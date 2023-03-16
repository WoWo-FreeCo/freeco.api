import config from 'config';
import mailgun from 'mailgun-js';
import crypto from 'crypto';
class MailgunService {
  /**
   * 發送 Email
   * @param data
   * @returns
   */
  async sendEmail(data: {
    email: string;
    hashData: string;
    details: { from: string; html: string; subject: string };
  }): Promise<string | unknown> {
    // mailgun init
    const mg = mailgun({
      apiKey: config.get<string>('MAILGUN_KEY'),
      domain: config.get<string>('MAILGUN_DOMAIN'),
    });
    // 發送訊息格式
    const sendData = {
      from: data.details.from,
      to: data.email,
      subject: data.details.subject,
      html: data.details.html,
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
  async encodeEmail(data: { email: string }): Promise<string> {
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

    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  /**
   * 驗證 email
   */
  async decipherEmail(data: { hashValue: string }): Promise<string> {
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
