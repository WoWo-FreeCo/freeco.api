import { Router } from 'express';
import ExampleController from '../../controllers/ExampleController';
import ExampleMiddleware from '../../middlewares/ExampleMiddleware';

const exampleRoute: Router = Router();

exampleRoute.route('').get(ExampleMiddleware.example, ExampleController.getAll);
export default exampleRoute;
