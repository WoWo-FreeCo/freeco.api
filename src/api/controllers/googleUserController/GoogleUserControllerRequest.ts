import { object, ObjectSchema, string } from 'yup';
export interface LoginBody {
  accessToken: string;
}

export const loginSchema: ObjectSchema<LoginBody> = object({
  accessToken: string().required(),
});
