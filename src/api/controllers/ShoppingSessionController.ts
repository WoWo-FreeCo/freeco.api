import { NextFunction, Request, Response } from 'express';
import { number, object, ObjectSchema, string, ValidationError } from 'yup';
import { ProductAttribute } from '.prisma/client';
import httpStatus from 'http-status';
import ShoppingCartService from '../services/ShoppingCartService';

const shoppingSessionIdSchema = number().required();
const idSchema = number().required();
interface CreateBody {
  attribute: ProductAttribute;
}

const createSchema: ObjectSchema<CreateBody> = object({
  attribute: string()
    .default(ProductAttribute.GENERAL)
    .oneOf([ProductAttribute.GENERAL, ProductAttribute.COLD_CHAIN])
    .required(),
});

interface CreateCartItemBody {
  productId: number;
  quantity: number;
}

const createCartItemSchema: ObjectSchema<CreateCartItemBody> = object({
  productId: number().required(),
  quantity: number().min(1).required(),
});

interface UpdateCartItemBody {
  productId: number;
  quantity: number;
}

const updateCartItemSchema: ObjectSchema<UpdateCartItemBody> = object({
  productId: number().required(),
  quantity: number().min(1).required(),
});
export interface ShoppingSession {
  id: number;
  attribute: ProductAttribute;
}

export interface CartItem {
  id: number;
  productId: number | null;
  quantity: number;
}
export interface ShoppingSessionDetail {
  id: number;
  attribute: ProductAttribute;
  cartItems: {
    id: number;
    quantity: number;
    product: {
      id: number;
      skuId: string | null;
      categoryId: number | null;
      coverImg: string | null;
      name: string;
      price: number;
      memberPrice: number;
      vipPrice: number;
      svipPrice: number;
      attribute: ProductAttribute;
    } | null;
  }[];
}

class ShoppingSessionController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    let createBody: CreateBody;
    try {
      // Note: Check request body is valid
      createBody = await createSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      // Note: 使用者建立購物車
      const { id } = req.userdata;
      const shoppingSession =
        await ShoppingCartService.createShoppingSessionByUser({
          userId: id,
          attribute: createBody.attribute,
        });

      if (!shoppingSession) {
        res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
        return;
      }

      const responseData: ShoppingSession = {
        id: shoppingSession.id,
        attribute: shoppingSession.attribute,
      };

      res.status(200).json({
        data: responseData,
      });
    } catch (err) {
      next(err);
    }
  }
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: 使用者取得所有購物車
      const { id } = req.userdata;
      const shoppingSessions =
        await ShoppingCartService.getShoppingSessionsByUser({
          userId: id,
        });
      const responseData: ShoppingSession[] = shoppingSessions.map(
        (shoppingSession) => ({
          id: shoppingSession.id,
          attribute: shoppingSession.attribute,
        }),
      );
      res.status(200).json({
        data: responseData,
      });
    } catch (err) {
      next(err);
    }
  }
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    let id: number;
    try {
      // Note: Check params is valid
      id = await idSchema.validate(req.params.id);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      // Note: 使用者刪除購物車
      const { id: userId } = req.userdata;
      const result = await ShoppingCartService.deleteShoppingSessionByUser({
        userId,
        id,
      });
      if (result) {
        res.status(200).json({
          data: result,
        });
      } else {
        res.status(httpStatus.BAD_REQUEST).json({ message: 'Id is invalid.' });
      }
    } catch (err) {
      next(err);
    }
  }
  async getDetail(
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
      // Note: 使用者取得某購物車詳細資訊
      const shoppingSessionDetail =
        await ShoppingCartService.getShoppingSessionDetailsById({
          id,
        });

      if (!shoppingSessionDetail) {
        res.status(httpStatus.NOT_FOUND).json({ message: 'Id is invalid.' });
        return;
      }
      const responseData: ShoppingSessionDetail = {
        id: shoppingSessionDetail.id,
        attribute: shoppingSessionDetail.attribute,
        cartItems: shoppingSessionDetail.cartItems.map((cartItem) => ({
          id: cartItem.id,
          quantity: cartItem.quantity,
          product: cartItem.product
            ? {
                id: cartItem.product.id,
                name: cartItem.product.name,
                coverImg: cartItem.product.coverImagePath || null,
                price: cartItem.product.price,
                memberPrice: cartItem.product.memberPrice,
                vipPrice: cartItem.product.vipPrice,
                svipPrice: cartItem.product.svipPrice,
                attribute: cartItem.product.attribute,
                skuId: cartItem.product.skuId,
                categoryId: cartItem.product.categoryId || null,
              }
            : null,
        })),
      };

      res.status(200).json({
        data: responseData,
      });
    } catch (err) {
      next(err);
    }
  }
  async createCartItem(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let shoppingSessionId: number;
    let createCartItemBody: CreateCartItemBody;
    try {
      // Note: Check params is valid
      shoppingSessionId = await shoppingSessionIdSchema.validate(
        req.params.shoppingSessionId,
      );
      // Note: Check request body is valid
      createCartItemBody = await createCartItemSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      // Note: 購物車加入商品項目
      // const { id: userId } = req.userdata;
      const anyShoppingSession =
        await ShoppingCartService.getShoppingSessionById({
          id: shoppingSessionId,
        });
      if (!anyShoppingSession) {
        res.status(httpStatus.NOT_FOUND).json({ message: 'Id is invalid.' });
        return;
      }

      const cartItem =
        await ShoppingCartService.createCartItemByShoppingSession({
          shoppingSessionId,
          productId: createCartItemBody.productId,
          quantity: createCartItemBody.quantity,
        });

      if (!cartItem) {
        res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
        return;
      }

      const responseData: CartItem = {
        id: cartItem.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
      };

      res.status(200).json({
        data: responseData,
      });
    } catch (err) {
      next(err);
    }
  }
  async updateCartItem(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let shoppingSessionId: number;
    let id: number;
    let updateCartItemBody: UpdateCartItemBody;
    try {
      // Note: Check params is valid
      shoppingSessionId = await shoppingSessionIdSchema.validate(
        req.params.shoppingSessionId,
      );
      id = await idSchema.validate(req.params.id);
      // Note: Check request body is valid
      updateCartItemBody = await updateCartItemSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      // Note: 購物車變更商品項目, e.g.數量
      const any = await ShoppingCartService.getCartItemByShoppingSession({
        shoppingSessionId,
        id,
      });
      if (!any) {
        res.status(httpStatus.NOT_FOUND).json({ message: 'Id is invalid.' });
        return;
      }

      const cartItem =
        await ShoppingCartService.updateCartItemByShoppingSession({
          shoppingSessionId,
          id,
          productId: updateCartItemBody.productId,
          quantity: updateCartItemBody.quantity,
        });

      if (!cartItem) {
        res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
        return;
      }

      const responseData: CartItem = {
        id: cartItem.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
      };

      res.status(200).json({
        data: responseData,
      });
    } catch (err) {
      next(err);
    }
  }
  async deleteCartItem(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let shoppingSessionId: number;
    let id: number;
    try {
      // Note: Check params is valid
      shoppingSessionId = await shoppingSessionIdSchema.validate(
        req.params.shoppingSessionId,
      );
      id = await idSchema.validate(req.params.id);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      // Note: 購物車刪除商品項目
      const any = await ShoppingCartService.getCartItemByShoppingSession({
        shoppingSessionId,
        id,
      });
      if (!any) {
        res.status(httpStatus.NOT_FOUND).json({ message: 'Id is invalid.' });
        return;
      }
      const result = await ShoppingCartService.deleteCartItemByShoppingSession({
        shoppingSessionId,
        id,
      });

      if (result) {
        res.status(200).json({
          data: result,
        });
      } else {
        res.status(httpStatus.BAD_REQUEST).json({ message: 'Id is invalid.' });
      }
    } catch (err) {
      next(err);
    }
  }
}

export default new ShoppingSessionController();
