import { Router } from 'express';
import UserController from '../../controllers/UserController';
import AuthMiddleware from '../../middlewares/AuthMiddleware';
import UserActivityController from '../../controllers/UserActivityController';

const userRoute: Router = Router();

userRoute.route('/register').post(UserController.register);
userRoute.route('/login').post(UserController.login);
userRoute.route('/refresh').get(UserController.refresh);
userRoute
  .route('/profile')
  .get(AuthMiddleware.authenticate, UserController.getProfile);

userRoute
  .route('/activity/activate')
  .post(AuthMiddleware.authenticate, UserActivityController.activate);
export default userRoute;
