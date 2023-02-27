import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { number, object, ObjectSchema, ValidationError } from 'yup';
import BonusPointService from '../services/BonusPointService';

interface UpdateBody {
  newRule: number;
}
const updateSchema: ObjectSchema<UpdateBody> = object({
  newRule: number().required()
});

class AdminBonusPointController {
  async get(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    const bonusPointRule = await BonusPointService.getBonusPointCashbackRule();
    if (bonusPointRule) {
      res.status(httpStatus.OK).json({data: bonusPointRule});
    } else {
      res.status(httpStatus.NOT_FOUND);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    let updateBody: UpdateBody;
    try {
      // Note: Check request body is valid
      updateBody = await updateSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      await BonusPointService.updateBonusPointCashbackRule(updateBody.newRule);
      res.status(httpStatus.OK).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminBonusPointController();
