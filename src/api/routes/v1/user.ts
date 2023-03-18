import { Router } from 'express';
import UserController from '../../controllers/UserController';
import AuthMiddleware from '../../middlewares/AuthMiddleware';
import UserActivityController from '../../controllers/UserActivityController';
import GoogleUserController from '../../controllers/googleUserController/index';
import FacebookUserController from '../../controllers/facebookUserController/index';
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
  )
  .get(
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
  )
  .post(
    '/activity/daily-check/:index',
    AuthMiddleware.authenticate('user'),
    UserActivityController.dailyCheck,
  )
  .get(
    '/activity/daily-check/record',
    AuthMiddleware.authenticate('user'),
    UserActivityController.getDailyCheckRecord,
  )
  // 忘記密碼
  .post('/forgot-password', UserController.forgotPassword)
  // 重置密碼
  .post('/reset-password', UserController.resetPassword)
  // google 登入綁定
  .post('/google-login', GoogleUserController.login)
  // facebook 登入綁定
  .post('/facebook-login', FacebookUserController.login);
export default userRoute;
