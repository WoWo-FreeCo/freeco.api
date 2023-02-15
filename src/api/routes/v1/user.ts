import { Router } from 'express';
import UserController from '../../controllers/UserController';

const userRoute: Router = Router();

userRoute.route('/register').post(UserController.createUser);
export default userRoute;
