import { Router } from 'express';
import upload from '../../middlewares/ImageMiddleware';
import ImageController from '../../controllers/ImageController';

const imageRoute: Router = Router();

imageRoute.route('').post(upload.single('image'),ImageController.create);
export default imageRoute;