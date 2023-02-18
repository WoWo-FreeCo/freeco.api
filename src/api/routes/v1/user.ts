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
  .post(
    '/activity/activate',
    AuthMiddleware.authenticate('user'),
    UserActivityController.activate,
  )
  .post(
    '/activity/daily-check/:index',
    AuthMiddleware.authenticate('user'),
    UserActivityController.dailyCheck,
  );
export default userRoute;
