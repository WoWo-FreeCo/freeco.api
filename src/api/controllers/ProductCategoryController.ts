import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import AdminProductCategoryService from '../services/ProductCategoryService';

interface ProductCategory {
  id: number;
  name: string;
}

class ProductCategoryController {
  async getAll(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
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
}

export default new ProductCategoryController();
