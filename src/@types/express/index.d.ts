export {};

declare global {
  namespace Express {
    interface Request {
      userdata: {
        id: string;
        role: 'USER' | 'ADMIN';
      };
    }
  }
}
