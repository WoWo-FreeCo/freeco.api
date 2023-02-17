import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import HomeBannerService from '../services/HomeBannerService';

interface HomeBanner {
  id: number;
  img: string;
  href: string;
}

class HomeBannerController {
  async getAll(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const productCategories = await HomeBannerService.gatAllHomeBanner();
      const responseData: HomeBanner[] = productCategories.map(
        (homeBanner) => ({
          id: homeBanner.id,
          img: homeBanner.img,
          href: homeBanner.href,
        }),
      );
      res.status(httpStatus.OK).json({ data: responseData });
    } catch (err) {
      next(err);
    }
  }
}

export default new HomeBannerController();
