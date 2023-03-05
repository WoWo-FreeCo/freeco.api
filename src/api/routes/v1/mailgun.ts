import { Router } from 'express';
import MailgunController from '../../controllers/MailgunController';
const MailgunRoute: Router = Router();

MailgunRoute.post(`/send-verify-register-email`, MailgunController.sendEmail)
  .post(`/create-hash-email`, MailgunController.createHashEmail)
  .get(`/vaildated-email`, MailgunController.validateEmail);

export default MailgunRoute;
