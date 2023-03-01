import prisma from '../../database/client/prisma';
import { User, UserActivation } from '@prisma/client';
import { Pagination } from '../../utils/helper/pagination';

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

interface UpdateUserInfoInput {
  id: string;
  email: string;
  nickname?: string;
  cellphone: string;
  telephone?: string;
  addressOne: string;
  addressTwo?: string;
  addressThree?: string;
}

export type MemberLevel = 'NORMAL' | 'VIP' | 'SVIP';

interface IUserService {
  getUserByRecommendCode(data: { recommendCode: string }): Promise<User | null>;
  getUserByEmail(data: { email: string }): Promise<User | null>;
  getUserByCellphone(data: { cellphone: string }): Promise<User | null>;
  getUserByTaxIDNumber(data: { taxIDNumber: string }): Promise<User | null>;
  getUserById(data: { id: string }): Promise<User | null>;
  getUserProfileById(data: {
    id: string;
  }): Promise<(User & { activation: UserActivation | null }) | null>;
  getUsers(data: {
    pagination: Pagination;
  }): Promise<(User & { activation: UserActivation | null })[]>;
  createUser(data: CreateUserInput): Promise<User>;
  updateUser(data: UpdateUserInfoInput): Promise<User | null>;
  getUserMemberLevel(data: { activation: UserActivation }): MemberLevel;
  incrementUserCredit(data: { credit: number }): Promise<void>;
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
  async getUserByRecommendCode(data: {
    recommendCode: string;
  }): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: {
        recommendCode: data.recommendCode,
      },
    });
    return user;
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

  async getUsers({
    pagination: { take, skip },
  }: {
    pagination: Pagination;
  }): Promise<(User & { activation: UserActivation | null })[]> {
    return prisma.user.findMany({
      include: {
        activation: true,
      },
      take,
      skip,
    });
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
  async updateUser(data: UpdateUserInfoInput): Promise<User | null> {
    try {
      return await prisma.user.update({
        where: {
          id: data.id,
        },
        data: {
          email: data.email,
          nickname: data.nickname,
          cellphone: data.cellphone,
          telephone: data.telephone,
          addressOne: data.addressOne,
          addressTwo: data.addressTwo,
          addressThree: data.addressThree,
        },
      });
    } catch (err) {
      return null;
    }
  }
  getUserMemberLevel(data: { activation: UserActivation }): MemberLevel {
    let memberLevel: MemberLevel = 'NORMAL';
    let count = 0;
    if (data.activation.FacebookGroupActivated) {
      count++;
    }
    if (data.activation.YouTubeChannelActivated) {
      count++;
    }
    if (data.activation.IGFollowActivated) {
      count++;
    }
    // Note: SVIP code completed and (綁定條件三選二）
    if (data.activation.SVIPActivated && count >= 2) {
      memberLevel = 'SVIP';
      // Note: VIP code completed and (綁定條件三選一）
    } else if (data.activation.VIPActivated && count >= 1) {
      memberLevel = 'VIP';
    }

    return memberLevel;
  }

  async incrementUserCredit(data: {
    userId: string;
    credit: number;
  }): Promise<void> {
    await prisma.user.update({
      where: {
        id: data.userId,
      },
      data: {
        rewardCredit: {
          increment: data.credit,
        },
      },
    });
  }
}

export default new UserService();
