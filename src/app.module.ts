import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { PreviewModule } from './preview/preview.module';
import { AppointmentModule } from './appointment/appointment.module';
import { MailModule } from './mail/mail.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    AuthModule,
    AuditModule,
    PrismaModule,
    PreviewModule,
    AppointmentModule,
    MailModule,
  ],
})
export class AppModule {}