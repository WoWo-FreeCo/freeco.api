import { Router } from 'express';
import AdminUserController from '../../controllers/AdminUserController';

const adminRoute: Router = Router();

adminRoute.route('/user/register').post(AdminUserController.register);
export default adminRoute;
