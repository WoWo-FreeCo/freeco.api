import { object, ObjectSchema, string } from 'yup';
import { User, UserActivation } from '@prisma/client';
import { Pagination } from '../../../utils/helper/pagination';

export type MemberLevel = 'NORMAL' | 'VIP' | 'SVIP';

export interface RegisterBody {
  email: string;
  password: string;
  nickname?: string;
  cellphone: string;
  telephone?: string;
  city: string;
  district: string;
  zipCode: string;
  addressOne: string;
  addressTwo?: string;
  addressThree?: string;
  // Note: 推薦帳號
  recommendedAccount?: string;
}

export const registerSchema: ObjectSchema<RegisterBody> = object({
  email: string().email().required(),
  password: string().required(),
  nickname: string().optional(),
  cellphone: string().required(),
  telephone: string().optional(),
  city: string().required(),
  district: string().required(),
  zipCode: string().required(),
  addressOne: string().required(),
  addressTwo: string().optional(),
  addressThree: string().optional(),
  recommendedAccount: string().optional(),
});

export interface SocialMediaRegisterBody {
  email: string;
  password?: string | null;
  nickname?: string;
  cellphone?: string | null;
  telephone?: string;
  addressOne?: string | null;
  addressTwo?: string;
  addressThree?: string;
  // Note: 推薦帳號
  recommendedAccount?: string;
}

export const socialMediaRegisterSchema: ObjectSchema<SocialMediaRegisterBody> =
  object({
    email: string().email().required(),
    password: string().optional(),
    nickname: string().optional(),
    cellphone: string().optional(),
    telephone: string().optional(),
    addressOne: string().optional(),
    addressTwo: string().optional(),
    addressThree: string().optional(),
    recommendedAccount: string().optional(),
  });

export interface CreateUserInput {
  email: string;
  password?: string | null;
  nickname?: string;
  cellphone?: string | null;
  telephone?: string;
  defaultReward?: number;
  city?: string;
  district?: string;
  zipCode?: string;
  addressOne?: string | null;
  addressTwo?: string;
  addressThree?: string;
}

export interface UpdateUserInfoInput {
  id: string;
  email: string;
  nickname?: string;
  cellphone: string;
  telephone?: string;
  city: string;
  district: string;
  zipCode: string;
  addressOne: string;
  addressTwo?: string;
  addressThree?: string;
}

export interface IUserService {
  getUserByRecommendCode(data: { recommendCode: string }): Promise<User | null>;
  getUserByEmail(data: { email: string }): Promise<User | null>;
  getUserByCellphone(data: { cellphone: string }): Promise<User | null>;
  getUserByTaxIDNumber(data: { taxIDNumber: string }): Promise<User | null>;
  getUserById(data: { id: string }): Promise<User | null>;
  getUserProfileById(data: {
    id: string;
  }): Promise<(User & { activation: UserActivation | null }) | null>;
  getUsers(data: {
    pagination: Pagination;
  }): Promise<(User & { activation: UserActivation | null })[]>;
  recommendByUser(data: {
    id: string;
    recommendInfo: { code: string };
  }): Promise<boolean>;
  createUser(data: CreateUserInput): Promise<User>;
  updateUser(data: UpdateUserInfoInput): Promise<User | null>;
  getUserMemberLevel(data: { activation: UserActivation }): MemberLevel;
  incrementUserCredit(data: { credit: number }): Promise<void>;
}
