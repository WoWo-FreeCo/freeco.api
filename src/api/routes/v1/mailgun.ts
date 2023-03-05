import { Router } from 'express';
import MailgunController from '../../controllers/MailgunController';
const MailgunRoute: Router = Router();

MailgunRoute.post(`/send-verify-register-email`, MailgunController.sendEmail)
  .post(`/create-hash-email`, MailgunController.encodeEmail)
  .get(`/validation-email`, MailgunController.validationEmail);

export default MailgunRoute;
