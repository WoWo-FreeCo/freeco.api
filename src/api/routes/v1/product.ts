import { Router } from 'express';
import ProductController from '../../controllers/ProductController';

const productRoute: Router = Router();

productRoute
  .get('', ProductController.getMany)
  .get('/:id/detail', ProductController.getDetailById);
export default productRoute;
