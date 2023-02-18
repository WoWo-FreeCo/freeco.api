import { NextFunction, Request, Response } from 'express';
import ExampleService from '../services/ExampleService';

class ExampleController {
  async create(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
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
  async getAll(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
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
  async update(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
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
  async delete(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
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
