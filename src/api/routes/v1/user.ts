import { Router } from 'express';
import UserController from '../../controllers/UserController';
import AuthMiddleware from '../../middlewares/AuthMiddleware';
import UserActivityController from '../../controllers/UserActivityController';

const userRoute: Router = Router();

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
  );
export default userRoute;
