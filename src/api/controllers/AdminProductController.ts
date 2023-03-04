import { NextFunction, Request, Response } from 'express';
import {
  array,
  number,
  object,
  ObjectSchema,
  string,
  ValidationError,
} from 'yup';
import httpStatus from 'http-status';
import AdminProductService from '../services/ProductService';
import { ProductAttribute } from '.prisma/client';
import ProductService from '../services/ProductService';

enum Field {
  MARKDOWN_INFOS = 'markdownInfos',
  IMAGES = 'images',
}

const idSchema = number().required();
const fieldSchema = string()
  .oneOf([Field.MARKDOWN_INFOS, Field.IMAGES])
  .required();
const indexSchema = number().min(0).required();

interface CreateBody {
  skuId: string;
  categoryId: number;
  coverImagePath?: string;
  name: string;
  price: number;
  memberPrice: number;
  vipPrice: number;
  svipPrice: number;
  attribute?: ProductAttribute;
}

const createSchema: ObjectSchema<CreateBody> = object({
  skuId: string().min(1).max(20).required(),
  categoryId: number().required(),
  coverImagePath: string().optional(),
  name: string().required(),
  price: number().min(0).required(),
  memberPrice: number().min(0).required(),
  vipPrice: number().min(0).required(),
  svipPrice: number().min(0).required(),
  attribute: string()
    .default(ProductAttribute.GENERAL)
    .oneOf([ProductAttribute.GENERAL, ProductAttribute.COLD_CHAIN])
    .optional(),
});

interface PutImageBody {
  img: string;
}
interface PutImagesListBody {
  images: PutImageBody[];
}

const putImageBodySchema: ObjectSchema<PutImageBody> = object({
  img: string().required(),
});

const putImageListBodySchema: ObjectSchema<PutImagesListBody> = object({
  images: array().of(putImageBodySchema).required(),
});

interface PutMarkdownInfoBody {
  title: string;
  text: string;
}

interface PutMarkdownInfoListBody {
  markdownInfos: PutMarkdownInfoBody[];
}

const putMarkdownInfoBodySchema: ObjectSchema<PutMarkdownInfoBody> = object({
  title: string().required(),
  text: string().required(),
});

const putMarkdownInfoListBodySchema: ObjectSchema<PutMarkdownInfoListBody> =
  object({
    markdownInfos: array().of(putMarkdownInfoBodySchema).required(),
  });

interface UpdateBody {
  skuId: string;
  categoryId: number;
  coverImagePath?: string;
  name: string;
  price: number;
  memberPrice: number;
  vipPrice: number;
  svipPrice: number;
  attribute?: ProductAttribute;
}
const updateSchema: ObjectSchema<UpdateBody> = object({
  skuId: string().min(1).max(20).required(),
  categoryId: number().required(),
  coverImagePath: string().optional(),
  name: string().required(),
  price: number().min(0).required(),
  memberPrice: number().min(0).required(),
  vipPrice: number().min(0).required(),
  svipPrice: number().min(0).required(),
  attribute: string()
    .default(ProductAttribute.GENERAL)
    .oneOf([ProductAttribute.GENERAL, ProductAttribute.COLD_CHAIN])
    .optional(),
});

interface ProductImage {
  img: string;
}

interface ProductMarkdownInfo {
  title: string;
  text: string;
}
interface Product {
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
  images: {
    img: string;
  }[];
}

class AdminProductController {
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
      const { data: valid, message } =
        await AdminProductService.checkCreateValidAttribute({
          ...createBody,
        });
      if (!valid) {
        res.status(httpStatus.BAD_REQUEST).json({
          message: `${message}.`,
        });
        return;
      }

      const product = await AdminProductService.createProduct({
        categoryId: createBody.categoryId,
        skuId: createBody.skuId,
        coverImagePath: createBody.coverImagePath,
        name: createBody.name,
        price: createBody.price,
        memberPrice: createBody.memberPrice,
        vipPrice: createBody.vipPrice,
        svipPrice: createBody.svipPrice,
        attribute: createBody.attribute,
      });
      if (product) {
        const responseData: Product = {
          id: product.id,
          skuId: product.skuId,
          categoryId: product.categoryId,
          coverImg: product.coverImagePath,
          name: product.name,
          price: product.price,
          memberPrice: product.memberPrice,
          vipPrice: product.vipPrice,
          svipPrice: product.svipPrice,
          attribute: product.attribute,
          images: product.productImages.map((img) => ({
            img: img.imagePath,
          })),
        };
        res.status(httpStatus.CREATED).json({
          data: responseData,
        });
      } else {
        res
          .status(httpStatus.BAD_REQUEST)
          .json({ message: 'Could not process the category id.' });
      }
    } catch (err) {
      next(err);
    }
  }
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    let id: number;
    let updateBody: UpdateBody;
    try {
      // Note: Check params is valid
      id = await idSchema.validate(req.params.id);
      // Note: Check request body is valid
      updateBody = await updateSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const { data: valid, message } =
        await AdminProductService.checkUpdateValidAttribute({
          id,
          ...updateBody,
        });
      if (!valid) {
        res.status(httpStatus.BAD_REQUEST).json({
          message: `${message}.`,
        });
        return;
      }

      const product = await AdminProductService.updateProduct({
        id,
        categoryId: updateBody.categoryId,
        skuId: updateBody.skuId,
        coverImagePath: updateBody.coverImagePath,
        name: updateBody.name,
        price: updateBody.price,
        memberPrice: updateBody.memberPrice,
        vipPrice: updateBody.vipPrice,
        svipPrice: updateBody.svipPrice,
        attribute: updateBody.attribute,
      });
      if (product) {
        const responseData: Product = {
          id: product.id,
          skuId: product.skuId,
          categoryId: product.categoryId,
          coverImg: product.coverImagePath,
          name: product.name,
          price: product.price,
          memberPrice: product.memberPrice,
          vipPrice: product.vipPrice,
          svipPrice: product.svipPrice,
          attribute: product.attribute,
          images: product.productImages.map((img) => ({
            img: img.imagePath,
          })),
        };
        res.status(httpStatus.OK).json({ data: responseData });
      } else {
        res.status(httpStatus.BAD_REQUEST).json({ message: 'Id is invalid.' });
      }
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
      const result = await AdminProductService.deleteProduct({ id });
      if (result) {
        res.status(httpStatus.OK).json({
          data: result,
        });
      } else {
        res.status(httpStatus.BAD_REQUEST).json({ message: 'Id is invalid.' });
      }
    } catch (err) {
      next(err);
    }
  }
  static async validateIdFieldIndex(req: Request): Promise<
    | {
        result: 'ok';
        data: { id: number; field: Field; index: number };
        err: undefined;
      }
    | { result: 'error'; data: undefined; err: unknown }
  > {
    try {
      // Note: Check params is valid
      const id = await idSchema.validate(req.params.id);
      const field = await fieldSchema.validate(req.params.field);
      const index = await indexSchema.validate(req.params.index);
      return {
        result: 'ok',
        data: {
          id,
          field,
          index,
        },
        err: undefined,
      };
    } catch (err) {
      return {
        result: 'error',
        data: undefined,
        err,
      };
    }
  }

  static async validateIdField(req: Request): Promise<
    | {
        result: 'ok';
        data: { id: number; field: Field };
        err: undefined;
      }
    | { result: 'error'; data: undefined; err: unknown }
  > {
    try {
      // Note: Check params is valid
      const id = await idSchema.validate(req.params.id);
      const field = await fieldSchema.validate(req.params.field);
      return {
        result: 'ok',
        data: {
          id,
          field,
        },
        err: undefined,
      };
    } catch (err) {
      return {
        result: 'error',
        data: undefined,
        err,
      };
    }
  }
  async putProductImagesOrMarkdownInfosByIndex(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { result, data, err } =
      // Note: Check params is valid
      await AdminProductController.validateIdFieldIndex(req);
    if (result === 'error') {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const { id, field, index } = data;
      const product = await ProductService.getProductById({
        id,
      });
      if (!product) {
        res
          .status(httpStatus.BAD_REQUEST)
          .json({ message: 'Product id is invalid.' });
      }

      if (field === 'images') {
        let imageBody: PutImageBody;
        try {
          // Note: Check request body is valid
          imageBody = await putImageBodySchema.validate(req.body);
        } catch (err) {
          res
            .status(httpStatus.BAD_REQUEST)
            .send((err as ValidationError).message);
          return;
        }
        const productImage = await ProductService.upsertProductImage({
          productId: id,
          index: index,
          image: {
            img: imageBody.img,
          },
        });

        if (!productImage) {
          res.status(httpStatus.BAD_REQUEST).json({
            message: 'Id (or index) is invalid',
          });
          return;
        }
        const responseData: ProductImage = {
          img: productImage.imagePath,
        };
        res.status(httpStatus.OK).json({
          data: responseData,
        });
        return;
      }

      if (field === 'markdownInfos') {
        let markdownInfoBody: PutMarkdownInfoBody;
        try {
          // Note: Check request body is valid
          markdownInfoBody = await putMarkdownInfoBodySchema.validate(req.body);
        } catch (err) {
          res
            .status(httpStatus.BAD_REQUEST)
            .send((err as ValidationError).message);
          return;
        }
        const productMarkdownInfo =
          await ProductService.upsertProductMarkdownInfo({
            productId: id,
            index: index,
            markdownInfo: {
              title: markdownInfoBody.title,
              text: markdownInfoBody.text,
            },
          });
        if (!productMarkdownInfo) {
          res.status(httpStatus.BAD_REQUEST).json({
            message: 'Id (or index) is invalid',
          });
          return;
        }
        const responseData: ProductMarkdownInfo = {
          title: productMarkdownInfo.title,
          text: productMarkdownInfo.text,
        };
        res.status(httpStatus.OK).json({
          data: responseData,
        });
        return;
      }

      res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
    } catch (err) {
      next(err);
    }
  }

  async putProductImagesOrMarkdownInfos(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { result, data, err } =
      // Note: Check params is valid
      await AdminProductController.validateIdField(req);
    if (result === 'error') {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const { id, field } = data;

      const product = await ProductService.getProductById({
        id,
      });
      if (!product) {
        res
          .status(httpStatus.BAD_REQUEST)
          .json({ message: 'Product id is invalid.' });
      }

      if (field === 'images') {
        let imageListBody: PutImagesListBody;
        try {
          // Note: Check request body is valid
          imageListBody = await putImageListBodySchema.validate(req.body);
        } catch (err) {
          res
            .status(httpStatus.BAD_REQUEST)
            .send((err as ValidationError).message);
          return;
        }
        const productImages = await ProductService.putProductImages({
          productId: id,
          images: imageListBody.images.map((image) => ({
            img: image.img,
          })),
        });

        const responseData: ProductImage[] = productImages.map(
          (productImage) => ({
            img: productImage.imagePath,
          }),
        );

        res.status(httpStatus.OK).json({
          data: responseData,
        });
        return;
      }

      if (field === 'markdownInfos') {
        let markdownInfoListBody: PutMarkdownInfoListBody;
        try {
          // Note: Check request body is valid
          markdownInfoListBody = await putMarkdownInfoListBodySchema.validate(
            req.body,
          );
        } catch (err) {
          res
            .status(httpStatus.BAD_REQUEST)
            .send((err as ValidationError).message);
          return;
        }
        const productMarkdownInfos =
          await ProductService.putProductMarkdownInfos({
            productId: id,
            markdownInfos: markdownInfoListBody.markdownInfos.map(
              (markdownInfo) => ({
                title: markdownInfo.title,
                text: markdownInfo.text,
              }),
            ),
          });
        const responseData: ProductMarkdownInfo[] = productMarkdownInfos.map(
          (productMarkdownInfo) => ({
            title: productMarkdownInfo.title,
            text: productMarkdownInfo.text,
          }),
        );
        res.status(httpStatus.OK).json({
          data: responseData,
        });
        return;
      }

      res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
    } catch (err) {
      next(err);
    }
  }
  async deleteProductImagesOrMarkdownInfosByIndex(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { result, data, err } =
      // Note: Check params is valid
      await AdminProductController.validateIdFieldIndex(req);
    if (result === 'error') {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const { id, field, index } = data;
      if (field === 'images') {
        const productImage = await ProductService.deleteProductImage({
          productId: id,
          index: index,
        });

        if (!productImage) {
          res.status(httpStatus.BAD_REQUEST).json({
            message: 'Id (or index) is invalid',
          });
          return;
        }
        const responseData: ProductImage = {
          img: productImage.imagePath,
        };
        res.status(httpStatus.OK).json({
          data: responseData,
        });
        return;
      }

      if (field === 'markdownInfos') {
        const productMarkdownInfo =
          await ProductService.deleteProductMarkdownInfo({
            productId: id,
            index: index,
          });
        if (!productMarkdownInfo) {
          res.status(httpStatus.BAD_REQUEST).json({
            message: 'Id (or index) is invalid',
          });
          return;
        }
        const responseData: ProductMarkdownInfo = {
          title: productMarkdownInfo.title,
          text: productMarkdownInfo.text,
        };
        res.status(httpStatus.OK).json({
          data: responseData,
        });
        return;
      }

      res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
    } catch (err) {
      next(err);
    }
  }
}

export default new AdminProductController();
