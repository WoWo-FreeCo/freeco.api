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

  checkItemsIfInventoryEnough(data: {
    items: { productId: number; quantity: number }[];
  }): Promise<boolean>;
}

class ProductInventoryService implements IProductInventoryService {
  private static async _checkInventoryPersistReady(data: {
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

  async getManyByProductIds(data: {
    productIds: number[];
  }): Promise<ProductInventory[]> {
    return prisma.productInventory.findMany({
      where: {
        productId: { in: data.productIds },
      },
    });
  }
  async checkItemsIfInventoryEnough(data: {
    items: { productId: number; quantity: number }[];
  }): Promise<boolean> {
    const productIds = data.items.map((item) => item.productId);
    const inventories = await this.getManyByProductIds({ productIds });
    const InventoryMap = inventories.reduce((result, inventory) => {
      result.set(inventory.productId, inventory);
      return result;
    }, new Map<number, ProductInventory>());
    return (
      data.items.findIndex(({ productId, quantity }) => {
        const inventory = InventoryMap.get(productId);
        return !inventory || inventory.quantity < quantity;
      }) === -1
    );
  }

  async add(data: {
    productId: number;
    quantity: number;
  }): Promise<ProductInventory | null> {
    try {
      const inventory =
        await ProductInventoryService._checkInventoryPersistReady({
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
      const inventory =
        await ProductInventoryService._checkInventoryPersistReady({
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
