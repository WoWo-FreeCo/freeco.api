import { Router } from 'express';
import OrderController from '../../controllers/OrderController';
import AuthMiddleware from '../../middlewares/AuthMiddleware';

const OrderRoute: Router = Router();

OrderRoute.use(AuthMiddleware.authenticate('user'));
OrderRoute.get('', OrderController.getMany)
  .get('/:id/detail', OrderController.getOrderDetailIncludesCoverImg)
  .post('/:id/cancel', OrderController.cancel)
  .get('/:id/logistics/detail', OrderController.getLogisticsDetail);
export default OrderRoute;
