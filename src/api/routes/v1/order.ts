import { Router } from 'express';
import OrderController from '../../controllers/OrderController';
import AuthMiddleware from '../../middlewares/AuthMiddleware';

const OrderRoute: Router = Router();

OrderRoute.use(AuthMiddleware.authenticate('user'));
OrderRoute.get('', OrderController.getMany).get(
  '/:id/detail',
  OrderController.getDetail,
);
export default OrderRoute;
