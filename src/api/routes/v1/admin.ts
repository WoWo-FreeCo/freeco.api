import { Router } from 'express';
import AdminUserController from '../../controllers/AdminUserController';
import AuthMiddleware from '../../middlewares/AuthMiddleware';
import AdminProductCategoryController from '../../controllers/AdminProductCategoryController';
import AdminProductController from '../../controllers/AdminProductController';
import AdminHomeBannerController from '../../controllers/AdminHomeBannerController';

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

const adminHomeBannerRouter: Router = Router();
adminHomeBannerRouter.post('/', AdminHomeBannerController.create);
adminHomeBannerRouter
  .route('/:id')
  .put(AdminHomeBannerController.update)
  .delete(AdminHomeBannerController.delete);

const adminRoute: Router = Router();
adminRoute
  .use('/user', adminUserRouter)
  .use(
    '/product-category',
    AuthMiddleware.authenticate('adminUser'),
    adminProductCategoryRouter,
  )
  .use('/product', AuthMiddleware.authenticate('adminUser'), adminProductRouter)
  .use(
    '/home-banner',
    AuthMiddleware.authenticate('adminUser'),
    adminHomeBannerRouter,
  );

export default adminRoute;
