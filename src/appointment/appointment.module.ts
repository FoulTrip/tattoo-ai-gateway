import { Module } from '@nestjs/common';
import { AppointmentService } from './services/appointment.service';
import { AppointmentController } from './appointment.controller';
import { AppointmentRepository } from './repositories/appointment.repository';
import { AppointmentGateway } from './gateways/appointment.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { MailModule } from '../mail/mail.module';
import { AppointmentRequestService } from './services/appointment-request.service';
import { AppointmentRequestRepository } from './repositories/appointment-request.repository';
import { AppointmentRequestController } from './appointment-request.controller';

@Module({
  imports: [PrismaModule, AuditModule, MailModule],
  controllers: [AppointmentController, AppointmentRequestController],
  providers: [
    AppointmentService,
    AppointmentRepository,
    AppointmentGateway,
    AppointmentRequestService,
    AppointmentRequestRepository,
    {
      provide: 'IAppointmentEventEmitter',
      useExisting: AppointmentGateway,
    },
  ],
  exports: [
    AppointmentService,
    AppointmentRepository,
    AppointmentGateway,
    AppointmentRequestService,
    AppointmentRequestRepository,
  ],
})
export class AppointmentModule {}
