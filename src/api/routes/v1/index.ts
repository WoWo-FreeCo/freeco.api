import { Router } from 'express';
import exampleRoute from './example';
import userRoute from './user';

const router: Router = Router();

router.use('/example', exampleRoute);
router.use('/user', userRoute);

export default router;
