import { NextFunction, Request, Response } from 'express';
import { number, object, ObjectSchema, ValidationError } from 'yup';
import httpStatus from 'http-status';
import ProductInventoryService from '../services/ProductInventoryService';

const idSchema = number().required();
interface AddBody {
  quantity: number;
}

const addBodySchema: ObjectSchema<AddBody> = object({
  quantity: number().required(),
});

interface InventoryOperationResult {
  id: number;
  quantity: number;
  updatedAt: Date;
}

class AdminProductInventoryController {
  async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    let id: number;
    let addBody: AddBody;
    try {
      // Note: Check params is valid
      id = await idSchema.validate(req.params.id);
      // Note: Check request body is valid
      addBody = await addBodySchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const inventory = await ProductInventoryService.add({
        productId: id,
        quantity: addBody.quantity,
      });
      if (!inventory) {
        res.status(httpStatus.BAD_REQUEST).json({
          message:
            'Failed to add inventory. Possible reasons include: (1)incorrect id.',
        });
        return;
      }
      const result: InventoryOperationResult = {
        id: inventory.productId,
        quantity: inventory.quantity,
        updatedAt: inventory.updatedAt,
      };
      res.status(httpStatus.OK).json({
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new AdminProductInventoryController();
