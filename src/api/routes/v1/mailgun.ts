import { Router } from 'express';
import MailgunController from '../../controllers/MailgunController';
const MailgunRoute: Router = Router();

MailgunRoute.post(
  `/send-verify-register-email`,
  MailgunController.testSendMail,
);

export default MailgunRoute;
