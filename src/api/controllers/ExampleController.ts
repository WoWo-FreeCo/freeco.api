import { NextFunction, Request, Response } from 'express';
import ExampleService from '../services/ExampleService';

class ExampleController {
  example(_req: Request, res: Response, _next: NextFunction) {
    ExampleService.logExample();
    res.status(200).send({
      message: 'Example Message (string)',
      data: 'Example Data (json object)',
    });
  }
}

export default new ExampleController();
