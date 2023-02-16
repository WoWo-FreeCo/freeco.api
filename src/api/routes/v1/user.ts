import { Router } from 'express';
import UserController from '../../controllers/UserController';

const userRoute: Router = Router();

userRoute.route('/register').post(UserController.register);
userRoute.route('/login').post(UserController.login);
userRoute.route('/refresh').get(UserController.refresh);
export default userRoute;
