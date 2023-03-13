import { CartItem, Product, ShoppingSession } from '@prisma/client';
import { ProductAttribute } from '.prisma/client';
import prisma from '../../database/client/prisma';

interface CreateShoppingSessionInput {
  userId: string;
  attribute: ProductAttribute;
}

interface CreateCartItemInput {
  shoppingSessionId: number;
  productId: number;
  quantity: number;
}
interface UpdateCartItemInput {
  shoppingSessionId: number;
  id: number;
  productId: number;
  quantity: number;
}

interface IShoppingCartService {
  createShoppingSessionByUser(
    data: CreateShoppingSessionInput,
  ): Promise<ShoppingSession | null>;

  getShoppingSessionById(data: { id: number }): Promise<ShoppingSession | null>;

  getShoppingSessionsByUser(data: {
    userId: string;
  }): Promise<ShoppingSession[]>;

  deleteShoppingSessionByUser(data: {
    userId: string;
    id: number;
  }): Promise<{ id: number } | null>;
  getShoppingSessionDetailsById(data: { id: number }): Promise<
    | (ShoppingSession & {
        cartItems: (CartItem & { product: Product | null })[];
      })
    | null
  >;
  getCartItemByShoppingSession(data: {
    shoppingSessionId: number;
    id: number;
  }): Promise<CartItem | null>;
  createCartItemByShoppingSession(
    data: CreateCartItemInput,
  ): Promise<CartItem | null>;
  updateCartItemByShoppingSession(
    data: UpdateCartItemInput,
  ): Promise<CartItem | null>;
  deleteCartItemByShoppingSession(data: {
    shoppingSessionId: number;
    id: number;
  }): Promise<{ id: number } | null>;
}

class ShoppingCartService implements IShoppingCartService {
  async createShoppingSessionByUser(
    data: CreateShoppingSessionInput,
  ): Promise<ShoppingSession | null> {
    try {
      return await prisma.shoppingSession.create({
        data: {
          userId: data.userId,
          attribute: data.attribute,
        },
      });
    } catch (err) {
      return null;
    }
  }
  async getShoppingSessionById(data: {
    id: number;
  }): Promise<ShoppingSession | null> {
    try {
      return await prisma.shoppingSession.findFirst({
        where: {
          id: data.id,
        },
      });
    } catch (err) {
      return null;
    }
  }

  async getShoppingSessionsByUser(data: {
    userId: string;
  }): Promise<ShoppingSession[]> {
    return prisma.shoppingSession.findMany({
      where: {
        userId: data.userId,
      },
    });
  }

  async deleteShoppingSessionByUser(data: {
    userId: string;
    id: number;
  }): Promise<{ id: number } | null> {
    try {
      const result = await prisma.shoppingSession.delete({
        where: {
          id: data.id,
        },
      });
      return {
        id: result.id,
      };
    } catch (err) {
      return null;
    }
  }

  async getShoppingSessionDetailsById(data: { id: number }): Promise<
    | (ShoppingSession & {
        cartItems: (CartItem & { product: Product | null })[];
      })
    | null
  > {
    try {
      return await prisma.shoppingSession.findFirst({
        where: {
          id: data.id,
        },
        include: {
          cartItems: {
            include: {
              product: true,
            },
          },
        },
      });
    } catch (err) {
      return null;
    }
  }
  async getCartItemByShoppingSession(data: {
    shoppingSessionId: number;
    id: number;
  }): Promise<CartItem | null> {
    try {
      return await prisma.cartItem.findFirst({
        where: {
          shoppingSessionId: data.shoppingSessionId,
          id: data.id,
        },
      });
    } catch (err) {
      return null;
    }
  }
  async createCartItemByShoppingSession(
    data: CreateCartItemInput,
  ): Promise<CartItem | null> {
    try {
      const valid = await this.checkCartItemCreateOrUpdateValid(data);
      if (!valid) {
        return null;
      }
      return await prisma.cartItem.create({
        data: {
          shoppingSessionId: data.shoppingSessionId,
          productId: data.productId,
          quantity: data.quantity,
        },
      });
    } catch (err) {
      return null;
    }
  }

  async updateCartItemByShoppingSession(
    data: UpdateCartItemInput,
  ): Promise<CartItem | null> {
    try {
      const valid = await this.checkCartItemCreateOrUpdateValid(data);
      if (!valid) {
        return null;
      }
      return await prisma.cartItem.update({
        where: {
          id: data.id,
        },
        data: {
          productId: data.productId,
          quantity: data.quantity,
        },
      });
    } catch (err) {
      return null;
    }
  }

  async deleteCartItemByShoppingSession(data: {
    shoppingSessionId: number;
    id: number;
  }): Promise<{ id: number } | null> {
    try {
      const result = await prisma.cartItem.delete({
        where: {
          id: data.id,
        },
      });
      return { id: result.id };
    } catch (err) {
      return null;
    }
  }

  private async checkCartItemCreateOrUpdateValid(
    data: CreateCartItemInput | UpdateCartItemInput,
  ): Promise<boolean> {
    const product = await prisma.product.findFirst({
      where: {
        id: data.productId,
      },
      include: {
        inventory: true,
      },
    });
    if (
      product &&
      product.inventory !== null &&
      product.inventory.quantity >= data.quantity
    ) {
      return true;
    }
    return false;
  }
}

export default new ShoppingCartService();
