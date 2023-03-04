import { ProductInventory } from '@prisma/client';
import prisma from '../../database/client/prisma';

interface IProductInventoryService {
  add(data: {
    productId: number;
    quantity: number;
  }): Promise<ProductInventory | null>;
  subtract(data: {
    productId: number;
    quantity: number;
  }): Promise<ProductInventory | null>;
}

class ProductInventoryService implements IProductInventoryService {
  static async checkInventoryReady(data: {
    productId: number;
  }): Promise<ProductInventory | null> {
    const productAndInventory = await prisma.product.findFirst({
      where: {
        id: data.productId,
      },
      include: {
        inventory: true,
      },
    });

    if (!productAndInventory) {
      return null;
    }
    if (!productAndInventory.inventory) {
      return prisma.productInventory.create({
        data: {
          productId: data.productId,
          quantity: 0,
        },
      });
    }
    return productAndInventory.inventory;
  }
  async add(data: {
    productId: number;
    quantity: number;
  }): Promise<ProductInventory | null> {
    try {
      const inventory = await ProductInventoryService.checkInventoryReady({
        productId: data.productId,
      });
      if (inventory === null) {
        return null;
      }

      return await prisma.productInventory.update({
        where: {
          productId: data.productId,
        },
        data: {
          quantity: {
            increment: data.quantity,
          },
        },
      });
    } catch (err) {
      return null;
    }
  }

  async subtract(data: {
    productId: number;
    quantity: number;
  }): Promise<ProductInventory | null> {
    try {
      const inventory = await ProductInventoryService.checkInventoryReady({
        productId: data.productId,
      });
      if (inventory && inventory.quantity >= data.quantity) {
        return await prisma.productInventory.update({
          where: {
            productId: data.productId,
          },
          data: {
            quantity: {
              decrement: data.quantity,
            },
          },
        });
      }
      return null;
    } catch (err) {
      return null;
    }
  }
}

export default new ProductInventoryService();
