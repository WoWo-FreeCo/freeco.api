import { Router } from 'express';
import AdminUserController from '../../controllers/AdminUserController';
import AuthMiddleware from '../../middlewares/AuthMiddleware';
import AdminProductCategoryController from '../../controllers/AdminProductCategoryController';

const adminUserRouter: Router = Router();
adminUserRouter.post('/register', AdminUserController.register);
adminUserRouter.post('/login', AdminUserController.login);
adminUserRouter.get('/refresh', AdminUserController.refresh);
adminUserRouter.get(
  '/profile',
  AuthMiddleware.authenticate('adminUser'),
  AdminUserController.getProfile,
);

const adminProductCategoryRouter: Router = Router();
adminProductCategoryRouter
  .route('')
  .post(AdminProductCategoryController.create)
  .get(AdminProductCategoryController.getAll);
adminProductCategoryRouter
  .route('/:id')
  .put(AdminProductCategoryController.update)
  .delete(AdminProductCategoryController.delete);

const adminRoute: Router = Router();
adminRoute.use('/user', adminUserRouter);
adminRoute.use(
  '/product-category',
  AuthMiddleware.authenticate('adminUser'),
  adminProductCategoryRouter,
);

export default adminRoute;
