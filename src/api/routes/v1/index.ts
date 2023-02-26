import { Router } from 'express';
import exampleRoute from './example';
import userRoute from './user';
import adminRoute from './admin';
import productRoute from './product';
import imageRoute from './image';
import productCategoryRoute from './productCategory';
import homeBannerRoute from './homeBanner';
import checkContentRoute from './checkContent';
import paymentRoute from './payment';
import orderRoute from './order';

const router: Router = Router();

router.use('/example', exampleRoute);
router.use('/admin', adminRoute);
router.use('/user', userRoute);
router.use('/product', productRoute);
router.use('/image', imageRoute);
router.use('/product-category', productCategoryRoute);
router.use('/home-banner', homeBannerRoute);
router.use('/check-content', checkContentRoute);
router.use('/payment', paymentRoute);
router.use('/order', orderRoute);

export default router;
