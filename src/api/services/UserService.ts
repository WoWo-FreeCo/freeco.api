import prisma from '../../database/client/prisma';
import { User, UserActivation } from '@prisma/client';

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

interface ActivateUserActivityInput {
  userId: string;
  kind: 'YouTubeChannel' | 'FacebookGroup' | 'VIP' | 'SVIP';
}

interface IUserService {
  getUserByEmail(data: { email: string }): Promise<User | null>;
  getUserByCellphone(data: { cellphone: string }): Promise<User | null>;
  getUserByTaxIDNumber(data: { taxIDNumber: string }): Promise<User | null>;
  getUserById(data: { id: string }): Promise<User | null>;
  getUserProfileById(data: {
    id: string;
  }): Promise<(User & { activation: UserActivation | null }) | null>;
  createUser(data: CreateUserInput): Promise<User>;
  activateUserActivity(data: ActivateUserActivityInput): Promise<void>;
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

  async getUserByCellphone(data: { cellphone: string }): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        cellphone: data.cellphone,
      },
    });
    return user;
  }
  async getUserByTaxIDNumber(data: {
    taxIDNumber: string;
  }): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        taxIDNumber: data.taxIDNumber,
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

  async getUserProfileById(data: {
    id: string;
  }): Promise<(User & { activation: UserActivation | null }) | null> {
    const user = await prisma.user.findFirst({
      where: {
        id: data.id,
      },
      include: {
        activation: true,
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
  async activateUserActivity({
    kind,
    userId,
  }: ActivateUserActivityInput): Promise<void> {
    const data = {};
    switch (kind) {
      case 'VIP':
        data['VIPActivated'] = true;
        break;
      case 'FacebookGroup':
        data['FacebookGroupActivated'] = true;
        break;
      case 'YouTubeChannel':
        data['YouTubeChannelActivated'] = true;
        break;
      case 'SVIP':
        data['SVIPActivated'] = true;
        break;
    }

    await prisma.userActivation.update({
      where: {
        userId,
      },
      data,
    });
  }
}

export default new UserService();
