import { PrismaClient } from "@prisma/client";

declare global {
  namespace globalThis {
    // add prisma property to globalThis type
    var prismadb: PrismaClient | undefined;
  }
}

export const prisma =
  globalThis.prismadb ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismadb = prisma;
}
