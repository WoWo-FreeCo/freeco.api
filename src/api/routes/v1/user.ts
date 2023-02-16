import { Router } from 'express';
import UserController from '../../controllers/UserController';

const userRoute: Router = Router();

userRoute.route('/register').post(UserController.register);
userRoute.route('/login').post(UserController.login);
export default userRoute;
