import prisma from '../../database/client/prisma';
import { HomeBanner } from '@prisma/client';

interface CreateHomeBannerInput {
  img: string;
  href: string;
}
interface UpdateHomeBannerInput {
  id: number;
  img: string;
  href: string;
}
interface IHomeBannerService {
  createHomeBanner(data: CreateHomeBannerInput): Promise<HomeBanner>;
  gatAllHomeBanner(): Promise<HomeBanner[]>;
  updateHomeBanner(data: UpdateHomeBannerInput): Promise<HomeBanner | null>;
  deleteHomeBanner(data: { id: number }): Promise<{ id: number } | null>;
}

class HomeBannerService implements IHomeBannerService {
  async createHomeBanner(data: CreateHomeBannerInput): Promise<HomeBanner> {
    const homeBanner = await prisma.homeBanner.create({
      data,
    });
    return homeBanner;
  }

  async gatAllHomeBanner(): Promise<HomeBanner[]> {
    const homeBanners = await prisma.homeBanner.findMany();
    return homeBanners;
  }

  async updateHomeBanner({
    id,
    img,
    href,
  }: UpdateHomeBannerInput): Promise<HomeBanner | null> {
    try {
      const homeBanner = await prisma.homeBanner.update({
        where: {
          id,
        },
        data: {
          img,
          href,
        },
      });
      return homeBanner;
    } catch (err) {
      return null;
    }
  }

  async deleteHomeBanner(data: { id: number }): Promise<{ id: number } | null> {
    try {
      const result = await prisma.homeBanner.delete({
        where: {
          id: data.id,
        },
      });
      return { id: result.id };
    } catch (err) {
      return null;
    }
  }
}

export default new HomeBannerService();
