import config from 'config';
import mailgun from 'mailgun-js';
class MailgunService {
  async testSendMail() {
    console.log(config.get<string>('MAILGUN_KEY'), 'MAILGUN_KEY');
    const mg = mailgun({
      apiKey: config.get<string>('MAILGUN_KEY'),
      domain: config.get<string>('MAILGUN_DOMAIN'),
    });
    const data = {
      from: 'Mailgun Sandbox <postmaster@sandbox20569f297dab44b9b0b44e07a91dd3bd.mailgun.org>',
      to: 'lightendesign5908@gmail.com',
      subject: '測試郵件',
      text: '這是一封使用Mailgun API送出的測試郵件',
    };
    try {
      await mg.messages().send(data);
      return '郵件發送成功';
    } catch (err) {
      return err;
    }
  }
}

export default new MailgunService();
