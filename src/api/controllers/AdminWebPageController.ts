import { NextFunction, Request, Response } from 'express';
import { number, object, ObjectSchema, string, ValidationError } from 'yup';
import httpStatus from 'http-status';
import WebPageService from '../services/WebPageService';

const idSchema = number().required();
interface UpdateBody {
  content: string;
}
const updateSchema: ObjectSchema<UpdateBody> = object({
  content: string().required()
});
interface WebPage {
  id: number;
  content: string;
}

class AdminWebPageController {
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
      const webPage = await WebPageService.updateWebPage({
        id: id,
        content: updateBody.content,
      });
      if (webPage) {
        const responseData: WebPage = {
          id: webPage.id,
          content: webPage.content,
        };
        res.status(httpStatus.OK).json({ data: responseData });
      } else {
        res.status(httpStatus.BAD_REQUEST).json({ message: 'Id is invalid.' });
      }
    } catch (err) {
      next(err);
    }
  }
}

export default new AdminWebPageController();
