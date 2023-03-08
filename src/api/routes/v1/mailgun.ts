import { Router } from 'express';
import MailgunController from '../../controllers/MailgunController';
const MailgunRoute: Router = Router();

MailgunRoute.get(`/validation-email`, MailgunController.validationEmail);

export default MailgunRoute;
