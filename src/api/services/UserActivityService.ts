import prisma from '../../database/client/prisma';
import { UserDailyCheck } from '@prisma/client';
import UserService from './userService/index';

interface ActivateUserActivityInput {
  userId: string;
  kind: 'YouTubeChannel' | 'FacebookGroup' | 'IGFollow' | 'VIP' | 'SVIP';
  code?: string;
}

interface DailyCheckInput {
  userId: string;
}

interface GetDailyCheckCountInput {
  userId: string;
}
interface GetLatestDailyCheckInput {
  userId: string;
  take: number;
}
interface IUserActivityService {
  activateUserActivity(data: ActivateUserActivityInput): Promise<boolean>;
  dailyCheck(data: DailyCheckInput): Promise<boolean>;
  getDailyCheckCount(data: GetDailyCheckCountInput): Promise<number>;
  getLatestDailyCheck(
    data: GetLatestDailyCheckInput,
  ): Promise<UserDailyCheck[]>;
}

class UserActivityService implements IUserActivityService {
  async activateUserActivity({
    kind,
    code,
    userId,
  }: ActivateUserActivityInput): Promise<boolean> {
    const userProfile = await UserService.getUserProfileById({ id: userId });
    if (!userProfile || !userProfile.activation) {
      return false;
    }
    let recommendUser;
    const data = {};
    // Note: 「綁定」機制
    switch (kind) {
      case 'VIP':
        if (!code) {
          return false;
        }
        // Note: 綁定 VIP 兌換碼為「推薦用戶兌換」
        recommendUser = await UserService.getUserByRecommendCode({
          recommendCode: code,
        });
        if (
          !userProfile.activation.VIPActivated &&
          recommendUser &&
          recommendUser.id !== userId
        ) {
          data['VIPActivated'] = true;
          data['InputVIPCode'] = code;
        } else {
          return false;
        }
        break;
      case 'FacebookGroup':
        if (userProfile.activation.FacebookGroupActivated) {
          return false;
        }
        data['FacebookGroupActivated'] = true;
        break;
      case 'YouTubeChannel':
        if (userProfile.activation.YouTubeChannelActivated) {
          return false;
        }
        data['YouTubeChannelActivated'] = true;
        break;
      case 'IGFollow':
        if (userProfile.activation.IGFollowActivated) {
          return false;
        }
        data['IGFollowActivated'] = true;
        break;
      case 'SVIP':
        if (!code) {
          return false;
        }
        // Note: 綁定 SVIP 兌換碼為「其他用戶的統編」
        recommendUser = await UserService.getUserByTaxIDNumber({
          taxIDNumber: code,
        });
        if (
          !userProfile.activation.SVIPActivated &&
          recommendUser &&
          recommendUser.id !== userId
        ) {
          data['SVIPActivated'] = true;
          data['InputSVIPCode'] = code;
        } else {
          return false;
        }
        break;
    }
    // Note: 「綁定後」機制
    let success = !!(await prisma.userActivation.update({
      where: {
        userId,
      },
      data,
    }));
    switch (kind) {
      case 'VIP':
        if (code) {
          success =
            success &&
            (await UserService.recommendByUser({
              id: userId,
              recommendInfo: {
                code,
              },
            }));
        }
        break;
      default:
        break;
    }
    return success;
  }

  async dailyCheck(data: DailyCheckInput): Promise<boolean> {
    // Note: Create Today (Date) instance
    const today = new Date();
    // Note: Add 8 hours to today (from UTC+0 to UTC+8)
    today.setUTCHours(today.getUTCHours() + 8);
    // Note: Set to zero hours, minutes, seconds, milliseconds
    today.setUTCHours(0, 0, 0, 0);
    let any = await prisma.userDailyCheck.findFirst({
      where: {
        userId: data.userId,
        createdAt: {
          gte: today,
        },
      },
    });

    if (any) {
      return false;
    }

    any = await prisma.userDailyCheck.create({
      data: {
        createdAt: today,
        userId: data.userId,
      },
    });

    return !!any;
  }

  async getDailyCheckCount(data: GetDailyCheckCountInput): Promise<number> {
    return prisma.userDailyCheck.count({
      where: {
        userId: data.userId,
      },
    });
  }

  async getLatestDailyCheck(
    data: GetLatestDailyCheckInput,
  ): Promise<UserDailyCheck[]> {
    return prisma.userDailyCheck.findMany({
      where: {
        userId: data.userId,
      },
      orderBy: [
        {
          createdAt: 'asc',
        },
      ],
      take: data.take,
    });
  }
}

export default new UserActivityService();
