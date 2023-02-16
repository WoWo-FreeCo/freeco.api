import { Router } from 'express';
import exampleRoute from './example';
import userRoute from './user';
import adminRoute from './admin';

const router: Router = Router();

router.use('/example', exampleRoute);
router.use('/admin', adminRoute);
router.use('/user', userRoute);

export default router;
