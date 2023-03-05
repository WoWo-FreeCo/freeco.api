import { Router } from 'express';
import AdminUserController from '../../controllers/AdminUserController';
import AuthMiddleware from '../../middlewares/AuthMiddleware';
import AdminProductCategoryController from '../../controllers/AdminProductCategoryController';
import AdminProductController from '../../controllers/AdminProductController';
import AdminHomeBannerController from '../../controllers/AdminHomeBannerController';
import AdminCheckContentController from '../../controllers/AdminCheckContentController';
import OrderController from '../../controllers/OrderController';
import AdminWebPageController from '../../controllers/AdminWebPageController';
import UserController from '../../controllers/UserController';
import AdminBonusPointController from '../../controllers/AdminBonusPointController';
import AdminProductInventoryController from '../../controllers/AdminProductInventoryController';

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
adminProductRouter
  .put('/:id/:field', AdminProductController.putProductImagesOrMarkdownInfos)
  .put(
    '/:id/:field/:index',
    AdminProductController.putProductImagesOrMarkdownInfosByIndex,
  )
  .delete(
    '/:id/:field/:index',
    AdminProductController.deleteProductImagesOrMarkdownInfosByIndex,
  );
adminProductRouter.post(
  '/:id/inventory/add',
  AdminProductInventoryController.add,
);

const adminHomeBannerRouter: Router = Router();
adminHomeBannerRouter.post('/', AdminHomeBannerController.create);
adminHomeBannerRouter
  .route('/:id')
  .put(AdminHomeBannerController.update)
  .delete(AdminHomeBannerController.delete);

const adminCheckContentRouter: Router = Router();
adminCheckContentRouter.post('/sequence', AdminCheckContentController.create);
adminCheckContentRouter
  .route('/sequence/:index')
  .put(AdminCheckContentController.update)
  .delete(AdminCheckContentController.delete);

const adminOrderRouter: Router = Router();
adminOrderRouter
  .get('', OrderController.getMany)
  .get('/details', OrderController.getManyDetails)
  .post('/:id/cancel-invoice', OrderController.cancelInvoice)
  .get('/:id/detail', OrderController.getDetail)
  .get('/:id/logistics/detail', OrderController.getLogisticsDetail)
  .get('/:id/revoke', OrderController.getRevokeInformation)
  .post('/:id/revoke/invoice-status', OrderController.updateRevokeInvoiceStatus)
  .post('/:id/revoke/payment-status', OrderController.updateRevokePaymentStatus)
  .post(
    '/:id/revoke/logistics-status',
    OrderController.updateRevokeLogisticsStatus,
  );

const adminWebPageRouter: Router = Router();
adminWebPageRouter.route('/:id').put(AdminWebPageController.update);

const adminBonusPointRouter: Router = Router();
adminBonusPointRouter
  .get('', AdminBonusPointController.get)
  .put('', AdminBonusPointController.update);

const adminNormalUserRouter: Router = Router();
adminNormalUserRouter.get('/profile', UserController.getManyProfile);

const adminRoute: Router = Router();
adminRoute
  .use('/user', adminUserRouter)
  .use(
    '/normal-user',
    AuthMiddleware.authenticate('adminUser'),
    adminNormalUserRouter,
  )
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
  )
  .use(
    '/check-content',
    AuthMiddleware.authenticate('adminUser'),
    adminCheckContentRouter,
  )
  .use('/order', AuthMiddleware.authenticate('adminUser'), adminOrderRouter)
  .use(
    '/web-page',
    AuthMiddleware.authenticate('adminUser'),
    adminWebPageRouter,
  )
  .use(
    '/bonus-point',
    AuthMiddleware.authenticate('adminUser'),
    adminBonusPointRouter,
  );

export default adminRoute;
