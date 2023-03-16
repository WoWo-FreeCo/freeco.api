import { Router } from 'express';
import SendinblueController from '../../controllers/SendinblueController';
const SendinblueRoute: Router = Router();

SendinblueRoute.get(`/validation-email`, SendinblueController.validationEmail);

export default SendinblueRoute;
