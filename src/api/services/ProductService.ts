import prisma from '../../database/client/prisma';
import { Product } from '@prisma/client';
import { ProductAttribute } from '.prisma/client';

interface CreateProductInput {
  name: string;
  price: number;
  memberPrice: number;
  vipPrice: number;
  svipPrice: number;
  categoryId?: number;
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
  getProducts(data: GetProductsInput): Promise<Product[]>;
  updateProduct(data: UpdateProductInput): Promise<Product | null>;
  deleteProduct(data: { id: number }): Promise<{ id: number } | null>;
}

class ProductService implements IProductService {
  async createProduct(data: CreateProductInput): Promise<Product | null> {
    try {
      const product = await prisma.product.create({
        data: {
          ...data,
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
}

export default new ProductService();
