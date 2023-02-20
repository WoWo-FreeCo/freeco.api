import prisma from '../../database/client/prisma';
import { UserDailyCheck } from '@prisma/client';

interface ActivateUserActivityInput {
  userId: string;
  kind: 'YouTubeChannel' | 'FacebookGroup' | 'IGFollow' | 'VIP' | 'SVIP';
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
  activateUserActivity(data: ActivateUserActivityInput): Promise<void>;

  dailyCheck(data: DailyCheckInput): Promise<boolean>;
  getDailyCheckCount(data: GetDailyCheckCountInput): Promise<number>;

  getLatestDailyCheck(
    data: GetLatestDailyCheckInput,
  ): Promise<UserDailyCheck[]>;
}

class UserActivityService implements IUserActivityService {
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
