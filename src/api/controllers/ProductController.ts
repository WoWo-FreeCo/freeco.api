import { NextFunction, Request, Response } from 'express';
import { number, object, ObjectSchema, ValidationError } from 'yup';
import httpStatus from 'http-status';
import AdminProductService from '../services/ProductService';
import { ProductAttribute } from '.prisma/client';
import { Pagination } from '../../utils/helper/pagination';

type GetManyByCategoryIdQuery = Pagination & { categoryId?: number };

const getManyByCategoryIdQuerySchema: ObjectSchema<GetManyByCategoryIdQuery> =
  object({
    take: number().min(0).max(200).default(10).optional(),
    skip: number().min(0).default(0).optional(),
    categoryId: number().optional(),
  });

interface Product {
  id: number;
  name: string;
  price: number;
  memberPrice: number;
  vipPrice: number;
  svipPrice: number;
  skuId: string | null;
  categoryId: number | null;
  attribute: ProductAttribute;
  images: string[];
}
class AdminProductController {
  async getMany(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let getManyByCategoryIdQuery: GetManyByCategoryIdQuery;
    try {
      // Note: Check request query is valid
      getManyByCategoryIdQuery = await getManyByCategoryIdQuerySchema.validate(
        req.query,
      );
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const products = await AdminProductService.getProducts({
        ...getManyByCategoryIdQuery,
        pagination: { ...getManyByCategoryIdQuery },
      });
      const responseData: Product[] = products.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        memberPrice: product.memberPrice,
        vipPrice: product.vipPrice,
        svipPrice: product.svipPrice,
        attribute: product.attribute,
        skuId: product.skuId,
        categoryId: product.categoryId,
        images: product.productImages.map(
          (productImages) => productImages.imagePath,
        ),
      }));
      res.status(httpStatus.OK).json({ data: responseData });
    } catch (err) {
      next(err);
    }
  }
}

export default new AdminProductController();
