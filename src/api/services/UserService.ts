import prisma from '../../database/client/prisma';
import { User } from '@prisma/client';

interface IUserService {
  getUserByEmail(data: { email: string }): Promise<User | null>;
  getUserById(data: { id: string }): Promise<User | null>;
  createUser(data: CreateUserInput): Promise<User>;
}

interface CreateUserInput {
  email: string;
  password: string;
  nickname?: string;
  cellphone: string;
  telephone?: string;
  defaultReward?: number;
  addressOne: string;
  addressTwo?: string;
  addressThree?: string;
}

class UserService implements IUserService {
  static generateRecommendCode(): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    result += characters.charAt(Math.floor(Math.random() * characters.length));
    result += characters.charAt(Math.floor(Math.random() * characters.length));
    let counter = 0;
    while (counter < 7) {
      result += numbers.charAt(Math.floor(Math.random() * numbers.length));
      counter += 1;
    }
    return result;
  }
  async getUserByEmail(data: { email: string }): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        email: data.email,
      },
    });
    return user;
  }

  async getUserById(data: { id: string }): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        id: data.id,
      },
    });
    return user;
  }

  async createUser(data: CreateUserInput): Promise<User> {
    let recommendCode = UserService.generateRecommendCode();
    let repeatedRecommendCodeUser = prisma.user.findFirst({
      where: {
        recommendCode,
      },
    });
    while (!repeatedRecommendCodeUser) {
      recommendCode = UserService.generateRecommendCode();
      repeatedRecommendCodeUser = prisma.user.findFirst({
        where: {
          recommendCode,
        },
      });
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        nickname: data.nickname,
        cellphone: data.cellphone,
        telephone: data.telephone,
        rewardCredit: data.defaultReward || 0,
        activation: {
          create: {},
        },
        addressOne: data.addressOne,
        addressTwo: data.addressTwo,
        addressThree: data.addressThree,
        recommendCode,
      },
    });

    return user;
  }
}

export default new UserService();
