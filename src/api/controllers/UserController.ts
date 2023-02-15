import { NextFunction, Request, Response } from 'express';
import UserService from '../services/UserService';
import { object, ObjectSchema, string, ValidationError } from 'yup';
import httpStatus from 'http-status';
import bcrypt from 'bcrypt';

interface CreateUserBody {
  email: string;
  password: string;
  nickname?: string;
  cellphone: string;
  telephone?: string;
  addressOne: string;
  addressTwo?: string;
  addressThree?: string;
}

const createUserSchema: ObjectSchema<CreateUserBody> = object({
  email: string().email().required(),
  password: string().required(),
  nickname: string().optional(),
  cellphone: string().required(),
  telephone: string().optional(),
  addressOne: string().required(),
  addressTwo: string().optional(),
  addressThree: string().optional(),
});

class UserController {
  static combineAddresses(data: {
    addressOne: string;
    addressTwo?: string;
    addressThree?: string;
  }) {
    const { addressOne, addressTwo, addressThree } = data;
    const addresses = [
      {
        address: addressOne,
      },
    ];
    if (addressTwo) {
      addresses.push({
        address: addressTwo,
      });
    }
    if (addressThree) {
      addresses.push({
        address: addressThree,
      });
    }
    return addresses;
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    let createUserInput: CreateUserBody;
    try {
      // Note: check request body is valid
      createUserInput = await createUserSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    try {
      // Note: check email is used
      const user = await UserService.getUserByEmail({ ...createUserInput });
      if (user) {
        res.status(httpStatus.BAD_REQUEST).send({
          message: 'email is used.',
        });
        return;
      }

      // Note: auto-gen a salt and hash password
      const hashedPassword = await bcrypt.hash(createUserInput.password, 10);

      // Note: create user
      await UserService.createUser({
        ...createUserInput,
        password: hashedPassword,
        addresses: UserController.combineAddresses({ ...createUserInput }),
      });
      res.status(httpStatus.OK).send({
        message: 'Example Message (string)',
        data: 'Example Data (json object)',
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new UserController();
