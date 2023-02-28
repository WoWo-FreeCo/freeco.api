import { Router } from 'express';
import UserController from '../../controllers/UserController';
import AuthMiddleware from '../../middlewares/AuthMiddleware';
import UserActivityController from '../../controllers/UserActivityController';

const userRoute: Router = Router({ mergeParams: true });

userRoute
  .post('/register', UserController.register)
  .post('/login', UserController.login)
  .get('/refresh', UserController.refresh)
  .get(
    '/profile',
    AuthMiddleware.authenticate('user'),
    UserController.getProfile,
  )
  .put(
    '/basic',
    AuthMiddleware.authenticate('user'),
    UserController.updateUserInfo,
  )
  .post(
    '/activity/activate',
    AuthMiddleware.authenticate('user'),
    UserActivityController.activate,
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
  );
export default userRoute;
