import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { object, ObjectSchema, string, ValidationError, number } from 'yup';
import AdminProductCategoryService from '../services/ProductCategoryService';

const idSchema = number().required();
interface CreateBody {
  name: string;
}

const createSchema: ObjectSchema<CreateBody> = object({
  name: string().required(),
});

interface UpdateBody {
  name: string;
}

const updateSchema: ObjectSchema<CreateBody> = object({
  name: string().required(),
});
interface ProductCategory {
  id: number;
  name: string;
}

class AdminProductCategoryController {
  async create(req: Request, res: Response, next: NextFunction) {
    let createBody: CreateBody;
    try {
      // Note: Check request body is valid
      createBody = await createSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const productCategory =
        await AdminProductCategoryService.createProductCategory({
          ...createBody,
        });
      const responseData: ProductCategory = {
        id: productCategory.id,
        name: productCategory.name,
      };
      res.status(httpStatus.CREATED).json({ data: responseData });
    } catch (err) {
      next(err);
    }
  }

  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const productCategories =
        await AdminProductCategoryService.gatAllProductCategory();
      const responseData: ProductCategory[] = productCategories.map(
        (productCategory) => ({
          id: productCategory.id,
          name: productCategory.name,
        }),
      );
      res.status(httpStatus.OK).json({ data: responseData });
    } catch (err) {
      next(err);
    }
  }
  async update(req: Request, res: Response, next: NextFunction) {
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
      const productCategory =
        await AdminProductCategoryService.updateProductCategory({
          id,
          ...updateBody,
        });
      if (productCategory) {
        res.status(httpStatus.OK).json({
          data: {
            id: productCategory.id,
            name: productCategory.name,
          },
        });
      } else {
        res.status(httpStatus.BAD_REQUEST).json({ message: 'Id is invalid.' });
      }
    } catch (err) {
      next(err);
    }
  }
  async delete(req: Request, res: Response, next: NextFunction) {
    let id: number;
    try {
      // Note: Check params is valid
      id = await idSchema.validate(req.params.id);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const result = await AdminProductCategoryService.deleteProductCategory({
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

export default new AdminProductCategoryController();
