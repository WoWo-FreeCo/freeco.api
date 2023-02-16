import { Router } from 'express';
import AdminUserController from '../../controllers/AdminUserController';
import AuthMiddleware from '../../middlewares/AuthMiddleware';

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
export default adminRoute;
