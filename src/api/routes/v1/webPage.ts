import { Router } from 'express';
import WebPageController from '../../controllers/WebPageController';

const webPageRoute: Router = Router();

webPageRoute.route('/:id').get(WebPageController.get);
export default webPageRoute;
