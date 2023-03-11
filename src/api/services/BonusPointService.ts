import {
  BonusPoint,
  BonusPointActivityType,
  BonusPointRule,
} from '@prisma/client';
import prisma from '../../database/client/prisma/index';
import {
  CASHBACK_RATE_ID,
  REGISTER_BONUS_POINT_ID,
  UPGRADE_TO_SVIP_BONUS_POINT_ID,
  UPGRADE_TO_VIP_BONUS_POINT_ID,
} from '../../utils/constant';
import { DELIVERY_ITEM_NAME } from './PaymentService';

interface IBonusPointService {
  // Bonus Point
  getUserBonusPointBalance(userId: string): Promise<number>;
  getUserBonusPointRecords(userId: string): Promise<BonusPoint[]>;
  gainFromOrderCashBack(orderId: string): Promise<void>;
  gainFromRegisterMembership(userId: string): Promise<void>;
  gainFromUpgradeMembership(userId: string): Promise<void>;
  redeem(userId: string, points: number): Promise<BonusPoint>;
  cancelRedemption(id: number): Promise<void>;

  // Bonus Point Rule
  getBonusPointCashbackRule(): Promise<BonusPointRule | null>;
  updateBonusPointCashbackRule(newRule: number): Promise<void>;
}

class BonusPointService implements IBonusPointService {
  private async updateUserRewardCredit(
    userId: string,
    rewordCredit: number,
  ): Promise<void> {
    const currentBalance = await this.getUserBonusPointBalance(userId);
    await prisma.user.update({
      where: { id: userId },
      data: { rewardCredit: currentBalance + rewordCredit },
    });
  }

  async getUserBonusPointBalance(userId: string): Promise<number> {
    // const records: BonusPoint[] = await this.getUserBonusPointRecords(userId);
    // const balance: number = 0 + records.map(record => record.points).reduce((sum, point) => sum + point);
    // return balance;

    // Note: record all bonus point data to `User`.`rewardCredit`
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user ? user.rewardCredit ?? 0 : 0;
  }

  async getUserBonusPointRecords(userId: string): Promise<BonusPoint[]> {
    return await prisma.bonusPoint.findMany({
      where: {
        userId: userId,
      },
    });
  }

  async gainFromOrderCashBack(orderId: string): Promise<void> {
    const BonusPointCashbackRule = await prisma.bonusPointRule.findFirst({
      where: {
        id: CASHBACK_RATE_ID,
      },
    });

    if (BonusPointCashbackRule == null) return;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
        user: true,
      },
    });

    if (order == null || order.user == null || order.user.recommendedBy == null)
      return;

    const orderPriceWithOutDeliveryFee = order.orderItems
      .filter((item) => item.name != DELIVERY_ITEM_NAME)
      .map((item) => item.price * item.quantity)
      .reduce((sum, price) => sum + price);

    this.createBonusPointRecord(
      BonusPointActivityType.REWARD,
      order.user.recommendedBy,
      (orderPriceWithOutDeliveryFee * BonusPointCashbackRule.rule) / 100,
    );
  }

  async gainFromRegisterMembership(userId: string): Promise<void> {
    const registerBonusPointRule = await prisma.bonusPointRule.findFirst({
      where: {
        id: REGISTER_BONUS_POINT_ID,
      },
    });

    if (registerBonusPointRule) {
      this.createBonusPointRecord(
        BonusPointActivityType.REGISTER,
        userId,
        registerBonusPointRule.rule,
      );
    }
  }

  async gainFromUpgradeMembership(userId: string): Promise<void> {
    const userActivation = await prisma.userActivation.findUnique({
      where: { userId: userId },
    });

    let upgradeBonusPointRule: BonusPointRule | null = null;
    if (userActivation?.SVIPActivated) {
      upgradeBonusPointRule = await prisma.bonusPointRule.findUnique({
        where: {
          id: UPGRADE_TO_SVIP_BONUS_POINT_ID,
        },
      });
    } else if (userActivation?.VIPActivated) {
      upgradeBonusPointRule = await prisma.bonusPointRule.findUnique({
        where: {
          id: UPGRADE_TO_VIP_BONUS_POINT_ID,
        },
      });
    }

    if (upgradeBonusPointRule) {
      this.createBonusPointRecord(
        BonusPointActivityType.UPGRADE,
        userId,
        upgradeBonusPointRule.rule,
      );
    }
  }

  async redeem(userId: string, points: number): Promise<BonusPoint> {
    return this.createBonusPointRecord(
      BonusPointActivityType.REDEEM,
      userId,
      0 - points,
    );
  }

  async cancelRedemption(id: number): Promise<void> {
    await prisma.bonusPoint.update({
      where: { id: id },
      data: { points: 0 },
    });
  }

  private async createBonusPointRecord(
    activityType: BonusPointActivityType,
    userId: string,
    points: number,
  ): Promise<BonusPoint> {
    await this.updateUserRewardCredit(userId, points);
    return await prisma.bonusPoint.create({
      data: {
        activityType: activityType,
        userId: userId,
        points: points,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async getBonusPointCashbackRule(): Promise<BonusPointRule | null> {
    return await prisma.bonusPointRule.findUnique({
      where: { id: CASHBACK_RATE_ID },
    });
  }

  async updateBonusPointCashbackRule(newRule: number): Promise<void> {
    await prisma.bonusPointRule.update({
      where: {
        id: CASHBACK_RATE_ID,
      },
      data: {
        rule: newRule,
      },
    });
  }
}

export default new BonusPointService();
