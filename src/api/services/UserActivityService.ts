import prisma from '../../database/client/prisma';
import { UserDailyCheck } from '@prisma/client';
import UserService from './UserService';

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
    switch (kind) {
      case 'VIP':
        if (!code) {
          return false;
        }
        // Note: 綁定 VIP 兌換碼為其他用戶的電子信箱
        recommendUser = await UserService.getUserByEmail({
          email: code,
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
        // Note: 綁定 SVIP 兌換碼為其他用戶的統編
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

    await prisma.userActivation.update({
      where: {
        userId,
      },
      data,
    });
    return true;
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
