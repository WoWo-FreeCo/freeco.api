import prisma from '../../database/client/prisma';
import { Product, ProductImage, ProductMarkdownInfo } from '@prisma/client';
import { Product as PrismaProduct, ProductAttribute } from '.prisma/client';
import { Pagination } from '../../utils/helper/pagination';

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
interface UpdateProductInput {
  id: number;
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
  pagination: Pagination;
}

export interface ProductsItemization {
  productId: number | null;
  productSkuId: string | null;
  name: string;
  quantity: number;
  price: number;
  memberPrice: number;
  vipPrice: number;
  svipPrice: number;
}

interface ProductsItemizationResult {
  itemizationList: ProductsItemization[];
  anyProductNotExists: boolean;
}

interface ProductWithImage {
  id: number;
  skuId: string | null;
  name: string;
  price: number;
  memberPrice: number;
  vipPrice: number;
  svipPrice: number;
  attribute: ProductAttribute;
  categoryId: number | null;
  createdAt: Date;
  updatedAt: Date;
  productImages: ProductImage[];
}

interface IProductService {
  productsItemization(
    data: {
      id: number;
      quantity: number;
    }[],
  ): Promise<ProductsItemizationResult>;
  createProduct(data: CreateProductInput): Promise<Product | null>;
  updateProduct(data: UpdateProductInput): Promise<Product | null>;
  deleteProduct(data: { id: number }): Promise<{ id: number } | null>;
  getProductById(data: { id: number }): Promise<Product | null>;
  getProductDetailById(data: { id: number }): Promise<
    | (Product & {
        productImages: ProductImage[];
        productMarkdownInfos: ProductMarkdownInfo[];
      })
    | null
  >;
  getProductsByIds(data: { ids: number[] }): Promise<Product[]>;
  getProducts(data: GetProductsInput): Promise<Product[]>;
  checkCreateValidAttribute(
    data: CreateProductInput,
  ): Promise<{ data: boolean; message?: string }>;
  checkUpdateValidAttribute(
    data: UpdateProductInput,
  ): Promise<{ data: boolean; message?: string }>;
}

class ProductService implements IProductService {
  async productsItemization(
    data: {
      id: number;
      quantity: number;
    }[],
  ): Promise<ProductsItemizationResult> {
    const products = await this.getProductsByIds({
      ids: data.map((product) => product.id),
    });
    const productsMap = new Map<Product['id'], PrismaProduct>();
    const itemizationMap = new Map<Product['id'], ProductsItemization>();
    products.forEach((product) => {
      productsMap.set(product.id, product);
    });
    let anyProductNotExists = false;
    data.forEach((item) => {
      const product = productsMap.get(item.id);
      const settlementItem = itemizationMap.get(item.id);
      if (product) {
        if (!settlementItem) {
          itemizationMap.set(product.id, {
            productId: product.id,
            productSkuId: product.skuId,
            name: product.name,
            quantity: item.quantity,
            price: product.price,
            memberPrice: product.memberPrice,
            vipPrice: product.vipPrice,
            svipPrice: product.svipPrice,
          });
        } else {
          itemizationMap.set(product.id, {
            ...settlementItem,
            quantity: settlementItem.quantity + item.quantity,
          });
        }
      } else {
        anyProductNotExists = true;
      }
    });
    const itemizationList = Array.from(itemizationMap.values());

    return { itemizationList, anyProductNotExists };
  }
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
      console.log(err);
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

  async getProductDetailById(data: { id: number }): Promise<
    | (Product & {
        productImages: ProductImage[];
        productMarkdownInfos: ProductMarkdownInfo[];
      })
    | null
  > {
    return prisma.product.findFirst({
      where: {
        id: data.id,
      },
      include: {
        productImages: true,
        productMarkdownInfos: true,
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
  }: GetProductsInput): Promise<ProductWithImage[]> {
    return prisma.product.findMany({
      where: {
        categoryId,
      },
      include: {
        productImages: true,
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
        data: {
          ...data,
          skuId: data.attribute === 'COLD_CHAIN' ? null : data.skuId,
        },
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

  async checkCreateValidAttribute(
    data: CreateProductInput,
  ): Promise<{ data: boolean; message?: string }> {
    switch (data.attribute) {
      case 'GENERAL':
        if (
          !data.skuId ||
          !!(await prisma.product.findFirst({
            where: {
              skuId: data.skuId,
            },
          }))
        ) {
          return {
            data: false,
            message: `A ${data.attribute} product need skuId, and skuId should be unique`,
          };
        }
        break;
      case 'COLD_CHAIN':
        if (data.skuId) {
          return {
            data: false,
            message: `A ${data.attribute} product need no skuId`,
          };
        }
        break;
      default:
        break;
    }
    return { data: true };
  }
  async checkUpdateValidAttribute(
    data: UpdateProductInput,
  ): Promise<{ data: boolean; message?: string }> {
    switch (data.attribute) {
      case 'GENERAL':
        if (
          !data.skuId ||
          !!(await prisma.product.findFirst({
            where: {
              AND: [
                {
                  skuId: data.skuId,
                },
                {
                  NOT: {
                    id: data.id,
                  },
                },
              ],
            },
          }))
        ) {
          return {
            data: false,
            message: `A ${data.attribute} product need skuId, and skuId should be unique`,
          };
        }
        break;
      case 'COLD_CHAIN':
        if (data.skuId) {
          return {
            data: false,
            message: `A ${data.attribute} product need no skuId`,
          };
        }
        break;
      default:
        break;
    }
    return { data: true };
  }
}

export default new ProductService();
