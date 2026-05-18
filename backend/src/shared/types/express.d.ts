import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
      user?: {
        id: string;
        email: string;
        name: string;
        role: Role;
      };
    }
  }
}
