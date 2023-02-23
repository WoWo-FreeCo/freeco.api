import prisma from '../../database/client/prisma';
import { Product } from '@prisma/client';
import { ProductAttribute } from '.prisma/client';

interface CreateProductInput {
  categoryId?: number;
  skuId?: string;
  name: string;
  price: number;
  memberPrice: number;
  vipPrice: number;
  svipPrice: number;
  attribute?: ProductAttribute;
}

interface GetProductsInput {
  categoryId?: number;
  pagination: {
    take: number;
    skip: number;
  };
}
interface UpdateProductInput {
  id: number;
  name: string;
  price: number;
  memberPrice: number;
  vipPrice: number;
  svipPrice: number;
  attribute?: ProductAttribute;
}
interface IProductService {
  createProduct(data: CreateProductInput): Promise<Product | null>;
  getProductById(data: { id: number }): Promise<Product | null>;
  getProductsByIds(data: { ids: number[] }): Promise<Product[]>;
  getProducts(data: GetProductsInput): Promise<Product[]>;
  updateProduct(data: UpdateProductInput): Promise<Product | null>;
  deleteProduct(data: { id: number }): Promise<{ id: number } | null>;
  checkValidAttribute(data: CreateProductInput): Promise<boolean>;
}

class ProductService implements IProductService {
  async createProduct(data: CreateProductInput): Promise<Product | null> {
    try {
      const product = await prisma.product.create({
        data: {
          ...data,
          skuId: data.skuId,
          categoryId: data.categoryId,
        },
      });
      return product;
    } catch (err) {
      return null;
    }
  }

  async getProductById(data: { id: number }): Promise<Product | null> {
    return prisma.product.findFirst({
      where: {
        id: data.id,
      },
    });
  }

  async getProductsByIds(data: { ids: number[] }): Promise<Product[]> {
    const idsFilterQuery = data.ids.map((id) => ({
      id,
    }));
    return prisma.product.findMany({
      where: {
        OR: idsFilterQuery,
      },
    });
  }

  async getProducts({
    categoryId,
    pagination: { take, skip },
  }: GetProductsInput): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        categoryId,
      },
      take,
      skip,
    });
  }

  async updateProduct(data: UpdateProductInput): Promise<Product | null> {
    try {
      return await prisma.product.update({
        where: {
          id: data.id,
        },
        data,
      });
    } catch (err) {
      return null;
    }
  }

  async deleteProduct(data: { id: number }): Promise<{ id: number } | null> {
    try {
      const result = await prisma.product.delete({
        where: {
          id: data.id,
        },
      });
      return { id: result.id };
    } catch (err) {
      return null;
    }
  }

  async checkValidAttribute(data: CreateProductInput): Promise<boolean> {
    if (data.attribute === 'GENERAL') {
      if (
        !data.skuId ||
        !!(await prisma.product.findFirst({
          where: {
            skuId: data.skuId,
          },
        }))
      ) {
        return false;
      }
    }
    return true;
  }
}

export default new ProductService();
