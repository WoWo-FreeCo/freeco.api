import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { object, ObjectSchema, string, ValidationError } from 'yup';
import bcrypt from 'bcrypt';
import AdminUserService from '../services/AdminUserService';

interface RegisterBody {
  email: string;
  password: string;
}

const registerSchema: ObjectSchema<RegisterBody> = object({
  email: string().email().required(),
  password: string().required(),
});

class AdminUserController {
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let registerBody: RegisterBody;
    try {
      // Note: Check request body is valid
      registerBody = await registerSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    try {
      // Note: Check email is used
      const user = await AdminUserService.getUserByEmail({ ...registerBody });
      if (user) {
        res.status(httpStatus.CONFLICT).send({
          message: 'Email is already used.',
        });
        return;
      }

      // Note: Auto-gen a `Salt` and hash password
      const hashedPassword = await bcrypt.hash(registerBody.password, 10);

      // Note: Create user
      await AdminUserService.createUser({
        ...registerBody,
        password: hashedPassword,
      });

      res.status(httpStatus.CREATED).send();
    } catch (err) {
      next(err);
    }
  }
}

export default new AdminUserController();
