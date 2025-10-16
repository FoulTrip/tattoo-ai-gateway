import { Module } from '@nestjs/common';
import { AppointmentService } from './services/appointment.service';
import { AppointmentController } from './appointment.controller';
import { AppointmentRepository } from './repositories/appointment.repository';
import { AppointmentGateway } from './gateways/appointment.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AppointmentController],
  providers: [
    AppointmentService,
    AppointmentRepository,
    AppointmentGateway,
    {
      provide: 'IAppointmentEventEmitter',
      useExisting: AppointmentGateway,
    },
  ],
  exports: [AppointmentService, AppointmentRepository, AppointmentGateway],
})
export class AppointmentModule {}
