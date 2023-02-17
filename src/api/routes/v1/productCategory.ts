import { Router } from 'express';
import ProductCategoryController from '../../controllers/ProductCategoryController';

const productCategoryRoute: Router = Router();

productCategoryRoute.route('').get(ProductCategoryController.getAll);
export default productCategoryRoute;
