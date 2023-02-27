import { NextFunction, Request, Response } from 'express';
import { number, object, ObjectSchema, ValidationError } from 'yup';
import httpStatus from 'http-status';
import ProductService from '../services/ProductService';
import { ProductAttribute } from '.prisma/client';
import { Pagination } from '../../utils/helper/pagination';

const idSchema = number().required();

type GetManyByCategoryIdQuery = Pagination & { categoryId?: number };

const getManyByCategoryIdQuerySchema: ObjectSchema<GetManyByCategoryIdQuery> =
  object({
    take: number().min(0).max(200).default(10).optional(),
    skip: number().min(0).default(0).optional(),
    categoryId: number().optional(),
  });

interface ProductDetail extends Product {
  markdownInfos: {
    title: string;
    text: string;
  }[];
}
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
class ProductController {
  async getDetailById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let id: number;
    try {
      // Note: Check params is valid
      id = await idSchema.validate(req.params.id);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const productDetail = await ProductService.getProductDetailById({
        id,
      });

      if (!productDetail) {
        res.status(httpStatus.BAD_REQUEST).json({ message: 'Id is invalid.' });
        return;
      }

      const responseData: ProductDetail = {
        id: productDetail.id,
        name: productDetail.name,
        price: productDetail.price,
        memberPrice: productDetail.memberPrice,
        vipPrice: productDetail.vipPrice,
        svipPrice: productDetail.svipPrice,
        attribute: productDetail.attribute,
        skuId: productDetail.skuId,
        categoryId: productDetail.categoryId,
        images: productDetail.productImages.map((img) => img.imagePath),
        markdownInfos: productDetail.productMarkdownInfos.map((info) => ({
          title: info.title,
          text: info.text,
        })),
      };

      res.status(httpStatus.OK).json({ data: responseData });
    } catch (err) {
      next(err);
    }
  }
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
      const products = await ProductService.getProducts({
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

export default new ProductController();
