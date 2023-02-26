import prisma from '../../database/client/prisma';
import { WebPage } from '@prisma/client';

interface UpdateWebPageInput {
 id: number;
 content: string;
}
interface IWebPageService {
  getWebPage(data: { id: number }): Promise<WebPage|null>;
  updateWebPage(data: UpdateWebPageInput): Promise<WebPage|null>;
}

class WebPageService implements IWebPageService {
  async getWebPage(data: { id: number }): Promise<WebPage|null> {
    return await prisma.webPage.findFirst({
      where: {
        id: data.id,
      },
    });
  }

  async updateWebPage(data: UpdateWebPageInput): Promise<WebPage | null> {
    try {
      return await prisma.webPage.update({
        where: {
          id: data.id,
        },
        data: {
          content: data.content,
        },
      });
    } catch (err) {
      return null;
    }
  }
}

export default new WebPageService();
