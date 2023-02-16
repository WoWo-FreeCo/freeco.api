import { NextFunction, Request, Response } from 'express';
import ExampleService from '../services/ExampleService';

class ExampleController {
  async example(_req: Request, res: Response, next: NextFunction) {
    try {
      await ExampleService.example();
      res.status(200).send({
        message: 'Example Message (string)',
        data: 'Example Data (json object)',
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new ExampleController();
