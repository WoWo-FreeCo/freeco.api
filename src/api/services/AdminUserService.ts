import prisma from '../../database/client/prisma';
import { AdminUser } from '@prisma/client';

interface CreateUserInput {
  email: string;
  password: string;
}

interface IAdminUserService {
  getUserByEmail(data: { email: string }): Promise<AdminUser | null>;
  getUserById(data: { id: string }): Promise<AdminUser | null>;
  createUser(data: CreateUserInput): Promise<AdminUser>;
}

class AdminUserService implements IAdminUserService {
  async getUserByEmail(data: { email: string }): Promise<AdminUser | null> {
    const adminUser = await prisma.adminUser.findFirst({
      where: {
        email: data.email,
      },
    });
    return adminUser;
  }
  async getUserById(data: { id: string }): Promise<AdminUser | null> {
    const adminUser = await prisma.adminUser.findFirst({
      where: {
        id: data.id,
      },
    });
    return adminUser;
  }

  async createUser(data: CreateUserInput): Promise<AdminUser> {
    const adminUser = await prisma.adminUser.create({
      data: {
        email: data.email,
        password: data.password,
      },
    });

    return adminUser;
  }
}

export default new AdminUserService();
