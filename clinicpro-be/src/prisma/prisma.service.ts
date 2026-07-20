import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly moduleRef: ModuleRef) {
    super();
    this.setupMiddleware();
  }

  private setupMiddleware() {
    // TODO: Migrate from $use (removed in Prisma v6) to $extends
    // Middleware theo dõi thay đổi status Prescription hiện bị vô hiệu hóa
    // do không tương thích Prisma v6. Cần migrate sang Prisma Client Extensions.
    this.logger.warn('Prisma middleware disabled \u2014 needs migration to $extends API');
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
