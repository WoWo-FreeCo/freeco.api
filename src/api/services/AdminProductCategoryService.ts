import prisma from '../../database/client/prisma';
import { ProductCategory } from '@prisma/client';

interface CreateProductCategoryInput {
  name: string;
}
interface UpdateProductCategoryInput {
  id: number;
  name: string;
}
interface IAdminProductCategoryService {
  createProductCategory(
    data: CreateProductCategoryInput,
  ): Promise<ProductCategory>;
  gatAllProductCategory(): Promise<ProductCategory[]>;
  updateProductCategory(
    data: UpdateProductCategoryInput,
  ): Promise<ProductCategory | null>;
  deleteProductCategory(data: { id: number }): Promise<{ id: number } | null>;
}

class AdminProductCategoryService implements IAdminProductCategoryService {
  async createProductCategory({
    name,
  }: CreateProductCategoryInput): Promise<ProductCategory> {
    const productCategory = await prisma.productCategory.create({
      data: {
        name,
      },
    });
    return productCategory;
  }

  async gatAllProductCategory(): Promise<ProductCategory[]> {
    const productCategories = await prisma.productCategory.findMany();
    return productCategories;
  }

  async updateProductCategory({
    id,
    name,
  }: UpdateProductCategoryInput): Promise<ProductCategory | null> {
    try {
      const productCategory = await prisma.productCategory.update({
        where: {
          id,
        },
        data: {
          name,
        },
      });
      return productCategory;
    } catch (err) {
      return null;
    }
  }

  async deleteProductCategory(data: {
    id: number;
  }): Promise<{ id: number } | null> {
    try {
      const result = await prisma.productCategory.delete({
        where: {
          id: data.id,
        },
      });
      return { id: result.id };
    } catch (err) {
      return null;
    }
  }
}

export default new AdminProductCategoryService();
