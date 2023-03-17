import { object, ObjectSchema, string } from 'yup';
export interface LoginBody {
  accessToken: string;
  // Note: 推薦帳號
  recommendedAccount?: string;
}

export const loginSchema: ObjectSchema<LoginBody> = object({
  accessToken: string().required(),
  recommendedAccount: string().optional(),
});
