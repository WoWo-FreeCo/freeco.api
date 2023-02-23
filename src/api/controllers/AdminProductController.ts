import { NextFunction, Request, Response } from 'express';
import { number, object, ObjectSchema, string, ValidationError } from 'yup';
import httpStatus from 'http-status';
import AdminProductService from '../services/ProductService';
import { ProductAttribute } from '.prisma/client';

const idSchema = number().required();
interface CreateBody {
  skuId?: string;
  categoryId?: number;
  name: string;
  price: number;
  memberPrice: number;
  vipPrice: number;
  svipPrice: number;
  attribute?: ProductAttribute;
}

const createSchema: ObjectSchema<CreateBody> = object({
  skuId: string().min(1).max(20).optional(),
  categoryId: number().optional(),
  name: string().required(),
  price: number().min(0).required(),
  memberPrice: number().min(0).required(),
  vipPrice: number().min(0).required(),
  svipPrice: number().min(0).required(),
  attribute: string()
    .default(ProductAttribute.GENERAL)
    .oneOf([ProductAttribute.GENERAL, ProductAttribute.COLD_CHAIN])
    .optional(),
});

interface UpdateBody {
  skuId?: string;
  categoryId?: number;
  name: string;
  price: number;
  memberPrice: number;
  vipPrice: number;
  svipPrice: number;
  attribute?: ProductAttribute;
}

const updateSchema: ObjectSchema<UpdateBody> = object({
  skuId: string().min(1).max(20).optional(),
  categoryId: number().optional(),
  name: string().required(),
  price: number().min(0).required(),
  memberPrice: number().min(0).required(),
  vipPrice: number().min(0).required(),
  svipPrice: number().min(0).required(),
  attribute: string()
    .default(ProductAttribute.GENERAL)
    .oneOf([ProductAttribute.GENERAL, ProductAttribute.COLD_CHAIN])
    .optional(),
});

interface Product {
  id: number;
  skuId?: string;
  name: string;
  price: number;
  memberPrice: number;
  vipPrice: number;
  svipPrice: number;
  attribute: ProductAttribute;
}
class AdminProductController {
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
      const valid = await AdminProductService.checkCreateValidAttribute({
        ...createBody,
      });
      if (!valid) {
        res.status(httpStatus.BAD_REQUEST).json({
          message: `Product with attribute [${createBody.attribute}] is invalid.`,
        });
        return;
      }

      const product = await AdminProductService.createProduct({
        ...createBody,
      });
      if (product) {
        const responseData: Product = {
          id: product.id,
          name: product.name,
          price: product.price,
          memberPrice: product.memberPrice,
          vipPrice: product.vipPrice,
          svipPrice: product.svipPrice,
          attribute: product.attribute,
        };
        res.status(httpStatus.CREATED).json({
          data: responseData,
        });
      } else {
        res
          .status(httpStatus.BAD_REQUEST)
          .json({ message: 'Could not process the category id .' });
      }
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
      const valid = await AdminProductService.checkUpdateValidAttribute({
        id,
        ...updateBody,
      });
      if (!valid) {
        res.status(httpStatus.BAD_REQUEST).json({
          message: `Product with attribute [${updateBody.attribute}] is invalid.`,
        });
        return;
      }

      const product = await AdminProductService.updateProduct({
        id,
        ...updateBody,
      });
      if (product) {
        res.status(httpStatus.OK).json({ data: product });
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
      const result = await AdminProductService.deleteProduct({ id });
      if (result) {
        res.status(httpStatus.OK).json({
          data: result,
        });
      } else {
        res.status(httpStatus.BAD_REQUEST).json({ message: 'Id is invalid.' });
      }
    } catch (err) {
      next(err);
    }
  }
}

export default new AdminProductController();
