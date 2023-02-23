import { Router } from 'express';
import OrderController from '../../controllers/PaymentController';
import AuthMiddleware from '../../middlewares/AuthMiddleware';

const PaymentRoute: Router = Router();

PaymentRoute.post(
  '',
  AuthMiddleware.authenticate('user'),
  OrderController.payment,
)
  .post(
    '/settlement',
    AuthMiddleware.authenticate('user'),
    OrderController.preSettlement,
  )
  .post('/listen-to-result', OrderController.listenResult);
export default PaymentRoute;
