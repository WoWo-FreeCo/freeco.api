import { NextFunction, Request, Response } from 'express';
import { number, object, ObjectSchema, string, ValidationError } from 'yup';
import httpStatus from 'http-status';
import UserService from '../services/UserService';
import UserActivityService from '../services/UserActivityService';
import CheckContentService from '../services/CheckContentService';

const indexSchema = number().min(0).max(29).required();

interface RemainderQuery {
  remainderBy: number;
}

type GetDailyCheckRecordQuery = RemainderQuery;

const GetDailyCheckRecordQuerySchema: ObjectSchema<GetDailyCheckRecordQuery> =
  object({
    remainderBy: number().min(1).default(30).optional(),
  });
enum ActivateKind {
  // VIP Code submit
  A = 'A',
  // Facebook粉絲團
  B = 'B',
  // YouTube Channel
  C = 'C',
  // IG 訂閱
  D = 'D',
  // SVIP Code submit
  E = 'E',
}
interface ActivateBody {
  kind: ActivateKind;
  code?: string;
}

const ActivateSchema: ObjectSchema<ActivateBody> = object({
  kind: string()
    .oneOf([
      ActivateKind.A,
      ActivateKind.B,
      ActivateKind.C,
      ActivateKind.D,
      ActivateKind.E,
    ])
    .required(),
  code: string().optional(),
});

interface DailyCheckRecord {
  index: number;
  createdAt: Date;
}

class UserActivityController {
  async activate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let activateBody: ActivateBody;
    try {
      // Note: Check request body is valid
      activateBody = await ActivateSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
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
              await UserActivityService.activateUserActivity({
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
            await UserActivityService.activateUserActivity({
              userId: id,
              kind: 'FacebookGroup',
            });
            break;
          case ActivateKind.C:
            await UserActivityService.activateUserActivity({
              userId: id,
              kind: 'YouTubeChannel',
            });
            break;
          case ActivateKind.D:
            await UserActivityService.activateUserActivity({
              userId: id,
              kind: 'IGFollow',
            });
            break;
          case ActivateKind.E:
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
              await UserActivityService.activateUserActivity({
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
    } catch (err) {
      next(err);
    }
  }

  async dailyCheck(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let index: number;
    try {
      // Note: Check params is valid
      index = await indexSchema.validate(req.params.index);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const { id } = req.userdata;
      const result = await UserActivityService.dailyCheck({ userId: id });
      if (result) {
        const checkContentInSequence =
          await CheckContentService.getCheckContentInSequenceByIndex({ index });

        if (!checkContentInSequence) {
          res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
          return;
        }

        res.sendStatus(httpStatus.ACCEPTED);
        await UserService.incrementUserCredit({
          userId: id,
          credit: checkContentInSequence.credit,
        });
      } else {
        res.status(httpStatus.BAD_REQUEST).json({
          data: {
            message: 'User already checked in today.',
          },
        });
      }
    } catch (err) {
      next(err);
    }
  }

  async getDailyCheckRecord(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let getDailyCheckRecordQuery: GetDailyCheckRecordQuery;
    try {
      // Note: Check request query is valid
      getDailyCheckRecordQuery = await GetDailyCheckRecordQuerySchema.validate(
        req.query,
      );
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const { remainderBy } = getDailyCheckRecordQuery;
      const { id } = req.userdata;
      const dailyCheckCount = await UserActivityService.getDailyCheckCount({
        userId: id,
      });

      const dailyCheckRecords = await UserActivityService.getLatestDailyCheck({
        userId: id,
        take: dailyCheckCount % remainderBy,
      });

      const result: DailyCheckRecord[] = dailyCheckRecords.map(
        (record, index) => ({
          index,
          createdAt: record.createdAt,
        }),
      );

      res.status(httpStatus.OK).json({
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new UserActivityController();
