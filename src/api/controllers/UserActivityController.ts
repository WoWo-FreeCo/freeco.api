import { NextFunction, Request, Response } from 'express';
import { object, ObjectSchema, string, ValidationError } from 'yup';
import httpStatus from 'http-status';
import UserService from '../services/UserService';

enum ActivateKind {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
}
interface ActivateBody {
  kind: ActivateKind;
  code?: string;
}

const ActivateSchema: ObjectSchema<ActivateBody> = object({
  kind: string()
    .oneOf([ActivateKind.A, ActivateKind.B, ActivateKind.C, ActivateKind.D])
    .required(),
  code: string().optional(),
});

class UserActivityController {
  async activate(req: Request, res: Response, _next: NextFunction) {
    let activateBody: ActivateBody;
    try {
      // Note: Check request body is valid
      activateBody = await ActivateSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    const { id } = req.userdata;
    const user = await UserService.getUserProfileById({ id });
    let failMessage;
    let recommendUser;
    if (user) {
      switch (activateBody.kind) {
        case ActivateKind.A:
          failMessage = 'VIP code is missing or invalid.';
          if (!activateBody.code) {
            res.status(httpStatus.BAD_REQUEST).json({
              message: failMessage,
            });
            return;
          }
          recommendUser = await UserService.getUserByCellphone({
            cellphone: activateBody.code,
          });
          if (recommendUser && recommendUser.id !== user.id) {
            await UserService.activateUserActivity({
              userId: id,
              kind: 'VIP',
            });
          } else {
            res.status(httpStatus.BAD_REQUEST).json({
              message: failMessage,
            });
            return;
          }
          break;
        case ActivateKind.B:
          await UserService.activateUserActivity({
            userId: id,
            kind: 'FacebookGroup',
          });
          break;
        case ActivateKind.C:
          await UserService.activateUserActivity({
            userId: id,
            kind: 'YouTubeChannel',
          });
          break;
        case ActivateKind.D:
          failMessage = 'SVIP code is missing or invalid.';
          if (!activateBody.code) {
            res.status(httpStatus.BAD_REQUEST).json({
              message: failMessage,
            });
            return;
          }
          recommendUser = await UserService.getUserByTaxIDNumber({
            taxIDNumber: activateBody.code,
          });
          if (recommendUser && recommendUser.id !== user.id) {
            await UserService.activateUserActivity({
              userId: id,
              kind: 'SVIP',
            });
          } else {
            res.status(httpStatus.BAD_REQUEST).json({
              message: failMessage,
            });
            return;
          }
          break;
      }
      res.sendStatus(httpStatus.ACCEPTED);
    } else {
      res.sendStatus(httpStatus.NOT_FOUND);
    }
  }
}

export default new UserActivityController();
