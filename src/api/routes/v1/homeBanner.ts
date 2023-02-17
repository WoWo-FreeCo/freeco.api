import { Router } from 'express';
import HomeBannerController from '../../controllers/HomeBannerController';

const homeBannerRoute: Router = Router();

homeBannerRoute.route('').get(HomeBannerController.getAll);
export default homeBannerRoute;
