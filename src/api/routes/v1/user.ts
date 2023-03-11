import { Router } from 'express';
import UserController from '../../controllers/UserController';
import AuthMiddleware from '../../middlewares/AuthMiddleware';
import UserActivityController from '../../controllers/UserActivityController';
import ShoppingSessionController from '../../controllers/ShoppingSessionController';

const userShoppingSessionRouter: Router = Router();
userShoppingSessionRouter
  .post('/', ShoppingSessionController.create)
  .get('/', ShoppingSessionController.getAll)
  .get('/:id/detail', ShoppingSessionController.getDetail)
  .delete('/:id', ShoppingSessionController.delete)
  .post(
    '/:shoppingSessionId/cart-item',
    ShoppingSessionController.createCartItem,
  )
  .put(
    '/:shoppingSessionId/cart-item/:id',
    ShoppingSessionController.updateCartItem,
  )
  .delete(
    '/:shoppingSessionId/cart-item/:id',
    ShoppingSessionController.deleteCartItem,
  );

const userActivityRouter: Router = Router();
userActivityRouter
  .post('/activate', UserActivityController.activate)
  .post('/daily-check/:index', UserActivityController.dailyCheck)
  .get('daily-check/record', UserActivityController.getDailyCheckRecord);

const userRoute: Router = Router({ mergeParams: true });

userRoute
  .post('/register', UserController.register)
  .post('/login', UserController.login)
  .get('/refresh', UserController.refresh)
  // 忘記密碼
  .post('/forgot-password', UserController.forgotPassword)
  // 重置密碼
  .post('/reset-password', UserController.resetPassword)
  .get(
    '/profile',
    AuthMiddleware.authenticate('user'),
    UserController.getProfile,
  ).get(
    '/bonus-point-records',
    AuthMiddleware.authenticate('user'),
    UserController.getBonusPointRecords,
  )
  .put(
    '/basic',
    AuthMiddleware.authenticate('user'),
    UserController.updateUserInfo,
  )
  .use('/activity', AuthMiddleware.authenticate('user'), userActivityRouter)
  .use(
    '/shopping-session',
    AuthMiddleware.authenticate('user'),
    userShoppingSessionRouter,
  );
export default userRoute;
