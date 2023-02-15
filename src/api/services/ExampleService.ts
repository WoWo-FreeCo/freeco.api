import prisma from '../../database/client/prisma';
import { User } from '@prisma/client';

interface IExampleService {
  createUserExample(): Promise<User[]>;
}

class ExampleService implements IExampleService {
  async createUserExample(): Promise<User[]> {
    await prisma.user.create({
      data: {
        name: 'Alice',
        email: 'alice@prisma.io',
        posts: {
          create: { title: 'Hello World' },
        },
        profile: {
          create: { bio: 'I like turtles' },
        },
      },
    });

    const allUsers = await prisma.user.findMany();

    return allUsers;
  }
}

export default new ExampleService();
