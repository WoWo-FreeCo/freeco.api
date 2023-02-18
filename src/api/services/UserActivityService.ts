import prisma from '../../database/client/prisma';

interface ActivateUserActivityInput {
  userId: string;
  kind: 'YouTubeChannel' | 'FacebookGroup' | 'VIP' | 'SVIP';
}

interface DailyCheckInput {
  userId: string;
}
interface IUserActivityService {
  activateUserActivity(data: ActivateUserActivityInput): Promise<void>;

  dailyCheck(data: DailyCheckInput): Promise<boolean>;
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
}

export default new UserActivityService();
