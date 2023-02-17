import { Router } from 'express';
import UserController from '../../controllers/UserController';
import AuthMiddleware from '../../middlewares/AuthMiddleware';
import UserActivityController from '../../controllers/UserActivityController';

const userRoute: Router = Router();

userRoute.post('/register', UserController.register);
userRoute.post('/login', UserController.login);
userRoute.get('/refresh', UserController.refresh);
userRoute.get(
  '/profile',
  AuthMiddleware.authenticate('user'),
  UserController.getProfile,
);

userRoute.post(
  '/activity/activate',
  AuthMiddleware.authenticate('user'),
  UserActivityController.activate,
);
export default userRoute;
