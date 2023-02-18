import { NextFunction, Request, Response } from 'express';
import CheckContentService from '../services/CheckContentService';
import {
  boolean,
  number,
  object,
  ObjectSchema,
  string,
  ValidationError,
} from 'yup';
import httpStatus from 'http-status';

const indexSchema = number().min(0).max(29).required();
interface CreateBody {
  index: number;
  video?: string;
  credit: number;
  isMission: boolean;
}

const createSchema: ObjectSchema<CreateBody> = object({
  index: indexSchema,
  video: string().optional(),
  credit: number().required().default(1),
  isMission: boolean().required(),
});

interface UpdateBody {
  video?: string;
  credit: number;
  isMission: boolean;
}

const updateSchema: ObjectSchema<UpdateBody> = object({
  video: string().optional(),
  credit: number().required(),
  isMission: boolean().required(),
});

interface CheckContentInSequence {
  index: number;
  video: string | null;
  credit: number;
  isMission: boolean;
}
class AdminCheckContentController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    let createBody: CreateBody;
    try {
      // Note: Check request body is valid
      createBody = await createSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const checkContentInSequence =
        await CheckContentService.upsertCheckContentInSequence({
          ...createBody,
        });
      if (checkContentInSequence) {
        const responseData: CheckContentInSequence = {
          index: checkContentInSequence.index,
          video: checkContentInSequence.video,
          credit: checkContentInSequence.credit,
          isMission: checkContentInSequence.isMission,
        };
        res.status(httpStatus.CREATED).json({ data: responseData });
      } else {
        res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (err) {
      next(err);
    }
  }
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    let index: number;
    let updateBody: UpdateBody;
    try {
      // Note: Check params is valid
      index = await indexSchema.validate(req.params.index);
      // Note: Check request body is valid
      updateBody = await updateSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const checkContentInSequence =
        await CheckContentService.upsertCheckContentInSequence({
          index,
          ...updateBody,
        });
      if (checkContentInSequence) {
        const responseData: CheckContentInSequence = {
          index: checkContentInSequence.index,
          video: checkContentInSequence.video,
          credit: checkContentInSequence.credit,
          isMission: checkContentInSequence.isMission,
        };
        res.status(httpStatus.CREATED).json({ data: responseData });
      } else {
        res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (err) {
      next(err);
    }
  }
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    let index: number;
    try {
      // Note: Check params is valid
      index = await indexSchema.validate(req.params.index);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const checkContentInSequence =
        await CheckContentService.clearCheckContentInSequence({ index });
      if (checkContentInSequence) {
        const responseData: CheckContentInSequence = {
          index: checkContentInSequence.index,
          video: checkContentInSequence.video,
          credit: checkContentInSequence.credit,
          isMission: checkContentInSequence.isMission,
        };
        res.status(httpStatus.CREATED).json({ data: responseData });
      } else {
        res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (err) {
      next(err);
    }
  }
}

export default new AdminCheckContentController();
