import { Router } from 'express';
import ProductController from '../../controllers/ProductController';

const productRoute: Router = Router();

productRoute.route('').get(ProductController.getMany);
export default productRoute;
