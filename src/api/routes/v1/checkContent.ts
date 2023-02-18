import { Router } from 'express';
import CheckContentController from '../../controllers/CheckContentController';

const checkContentRoute: Router = Router();

checkContentRoute.route('/sequence').get(CheckContentController.getAll);
export default checkContentRoute;
