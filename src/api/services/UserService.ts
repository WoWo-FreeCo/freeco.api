import prisma from '../../database/client/prisma';
import { User } from '@prisma/client';

interface IUserService {
  getUserByEmail(data: { email: string }): Promise<User | null>;
  createUser(data: CreateUserInput): Promise<User>;
}

interface CreateUserInput {
  email: string;
  password: string;
  nickname?: string;
  cellphone: string;
  telephone?: string;
  defaultReward?: number;
  addresses: { address: string; telephone?: string }[];
}

class UserService implements IUserService {
  async getUserByEmail(data: { email: string }): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        email: data.email,
      },
    });
    return user;
  }

  async createUser(data: CreateUserInput): Promise<User> {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        nickname: data.nickname,
        cellphone: data.cellphone,
        telephone: data.telephone,
        record: {
          create: {
            reward: data.defaultReward || 0,
          },
        },
        activity: {
          create: {},
        },
        addresses: {
          create: data.addresses,
        },
      },
    });

    return user;
  }
}

export default new UserService();
