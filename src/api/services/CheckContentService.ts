import prisma from '../../database/client/prisma';
import { CheckContentInSequence } from '@prisma/client';

interface GetCheckContentInSequenceByIndex {
  index: number;
}

interface UpdateCheckContentInSequenceInput {
  index: number;
  video?: string | null;
  credit: number;
  isMission: boolean;
}
interface ICheckContentService {
  getAllCheckContentInSequence(): Promise<CheckContentInSequence[]>;
  getCheckContentInSequenceByIndex(
    data: GetCheckContentInSequenceByIndex,
  ): Promise<CheckContentInSequence | null>;
  upsertCheckContentInSequence(
    data: UpdateCheckContentInSequenceInput,
  ): Promise<CheckContentInSequence | null>;
  clearCheckContentInSequence(data: {
    index: number;
  }): Promise<CheckContentInSequence | null>;
}

class CheckContentService implements ICheckContentService {
  static maxCheckContentInSequence = 30;
  static defaultCheckContentInSequence = {
    video: null,
    credit: 1,
    isMission: false,
  };
  async clearCheckContentInSequence({
    index,
  }: {
    index: number;
  }): Promise<CheckContentInSequence | null> {
    try {
      return await prisma.checkContentInSequence.upsert({
        where: {
          index,
        },
        create: {
          index,
          ...CheckContentService.defaultCheckContentInSequence,
        },
        update: CheckContentService.defaultCheckContentInSequence,
      });
    } catch (err) {
      return null;
    }
  }

  async getAllCheckContentInSequence(): Promise<CheckContentInSequence[]> {
    const result: CheckContentInSequence[] = [];
    const checkContentsInSequence =
      await prisma.checkContentInSequence.findMany({
        orderBy: [{ index: 'desc' }],
        where: {
          index: {
            lte: CheckContentService.maxCheckContentInSequence,
          },
        },
      });

    for (let i = 0; i < CheckContentService.maxCheckContentInSequence; i++) {
      result.push({
        index: i,
        ...CheckContentService.defaultCheckContentInSequence,
      });
    }

    checkContentsInSequence.forEach((checkContent) => {
      if (result.length >= checkContent.index) {
        result[checkContent.index] = checkContent;
      }
    });
    return result;
  }
  async getCheckContentInSequenceByIndex(
    data: GetCheckContentInSequenceByIndex,
  ): Promise<CheckContentInSequence | null> {
    try {
      const result = await prisma.checkContentInSequence.findFirst({
        where: {
          index: data.index,
        },
      });
      if (!result) {
        return {
          index: data.index,
          ...CheckContentService.defaultCheckContentInSequence,
        };
      }
      return result;
    } catch (err) {
      return null;
    }
  }
  async upsertCheckContentInSequence(
    data: UpdateCheckContentInSequenceInput,
  ): Promise<CheckContentInSequence | null> {
    try {
      return await prisma.checkContentInSequence.upsert({
        where: {
          index: data.index,
        },
        create: { ...data },
        update: { ...data },
      });
    } catch (err) {
      return null;
    }
  }
}

export default new CheckContentService();
