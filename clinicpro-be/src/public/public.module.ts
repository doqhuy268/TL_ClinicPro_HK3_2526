import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PublicController],
  providers: [PrismaService],
  exports: [],
})
export class PublicModule {}
