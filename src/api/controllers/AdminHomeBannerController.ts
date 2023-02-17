import { NextFunction, Request, Response } from 'express';
import { number, object, ObjectSchema, string, ValidationError } from 'yup';
import HomeBannerService from '../services/HomeBannerService';
import httpStatus from 'http-status';

const idSchema = number().required();
interface CreateBody {
  img: string;
  href: string;
}

const createSchema: ObjectSchema<CreateBody> = object({
  img: string().required(),
  href: string().required(),
});

interface UpdateBody {
  img: string;
  href: string;
}

interface HomeBanner {
  id: number;
  img: string;
  href: string;
}

const updateSchema: ObjectSchema<UpdateBody> = object({
  img: string().required(),
  href: string().required(),
});

class AdminHomeBannerController {
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
      const homeBanner = await HomeBannerService.createHomeBanner({
        ...createBody,
      });
      const responseData: HomeBanner = {
        id: homeBanner.id,
        img: homeBanner.img,
        href: homeBanner.href,
      };
      res.status(httpStatus.CREATED).json({ data: responseData });
    } catch (err) {
      next(err);
    }
  }
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    let id: number;
    let updateBody: UpdateBody;
    try {
      // Note: Check params is valid
      id = await idSchema.validate(req.params.id);
      // Note: Check request body is valid
      updateBody = await updateSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const homeBanner = await HomeBannerService.updateHomeBanner({
        id,
        ...updateBody,
      });
      if (homeBanner) {
        res.status(httpStatus.OK).json({
          data: {
            id: homeBanner.id,
            img: homeBanner.img,
            href: homeBanner.href,
          },
        });
      } else {
        res.status(httpStatus.BAD_REQUEST).json({ message: 'Id is invalid.' });
      }
    } catch (err) {
      next(err);
    }
  }
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    let id: number;
    try {
      // Note: Check params is valid
      id = await idSchema.validate(req.params.id);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const result = await HomeBannerService.deleteHomeBanner({
        id,
      });
      if (result) {
        res.status(httpStatus.OK).json(result);
      } else {
        res.status(httpStatus.BAD_REQUEST).json({ message: 'Id is invalid.' });
      }
    } catch (err) {
      next(err);
    }
  }
}

export default new AdminHomeBannerController();
