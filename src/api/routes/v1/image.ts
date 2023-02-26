import { Router } from 'express';
import upload from '../../middlewares/ImageMiddleware';
import ImageController from '../../controllers/ImageController';

const imageRoute: Router = Router();

imageRoute.route('').post(upload.array('image'),ImageController.create);
export default imageRoute;