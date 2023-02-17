import { Router } from 'express';
import AdminUserController from '../../controllers/AdminUserController';
import AuthMiddleware from '../../middlewares/AuthMiddleware';
import AdminProductCategoryController from '../../controllers/AdminProductCategoryController';

const adminRoute: Router = Router();

adminRoute.route('/user/register').post(AdminUserController.register);
adminRoute.route('/user/login').post(AdminUserController.login);
adminRoute.route('/user/refresh').get(AdminUserController.refresh);
adminRoute
  .route('/user/profile')
  .get(
    AuthMiddleware.authenticate('adminUser'),
    AdminUserController.getProfile,
  );

adminRoute
  .route('/product-category')
  .post(
    AuthMiddleware.authenticate('adminUser'),
    AdminProductCategoryController.create,
  )
  .get(
    AuthMiddleware.authenticate('adminUser'),
    AdminProductCategoryController.getAll,
  );
adminRoute
  .route('/product-category/:id')
  .put(
    AuthMiddleware.authenticate('adminUser'),
    AdminProductCategoryController.update,
  )
  .delete(
    AuthMiddleware.authenticate('adminUser'),
    AdminProductCategoryController.delete,
  );
export default adminRoute;
