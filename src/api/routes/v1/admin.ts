import { Router } from 'express';
import AdminUserController from '../../controllers/AdminUserController';
import AuthMiddleware from '../../middlewares/AuthMiddleware';
import AdminProductCategoryController from '../../controllers/AdminProductCategoryController';
import AdminProductController from '../../controllers/AdminProductController';

const adminUserRouter: Router = Router();
adminUserRouter
  .post('/register', AdminUserController.register)
  .post('/login', AdminUserController.login)
  .get('/refresh', AdminUserController.refresh)
  .get(
    '/profile',
    AuthMiddleware.authenticate('adminUser'),
    AdminUserController.getProfile,
  );

const adminProductCategoryRouter: Router = Router();
adminProductCategoryRouter.post('', AdminProductCategoryController.create);
adminProductCategoryRouter
  .route('/:id')
  .put(AdminProductCategoryController.update)
  .delete(AdminProductCategoryController.delete);

const adminProductRouter: Router = Router();
adminProductRouter.post('/', AdminProductController.create);
adminProductRouter
  .route('/:id')
  .put(AdminProductController.update)
  .delete(AdminProductController.delete);

const adminRoute: Router = Router();
adminRoute
  .use('/user', adminUserRouter)
  .use(
    '/product-category',
    AuthMiddleware.authenticate('adminUser'),
    adminProductCategoryRouter,
  )
  .use(
    '/product',
    AuthMiddleware.authenticate('adminUser'),
    adminProductRouter,
  );

export default adminRoute;
