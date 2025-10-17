import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './services/mail.service';
import { MailRepository } from './repositories/mail.repository';
import { MailController } from './mail.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [MailController],
  providers: [
    MailService,
    MailRepository,
  ],
  exports: [MailService, MailRepository],
})
export class MailModule {}