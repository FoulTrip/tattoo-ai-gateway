import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditRepository } from './repositories/audit.repositorie';
import { HelpersAuditService } from './services/helpers.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AuditService, AuditRepository, HelpersAuditService],
  exports: [AuditService, AuditRepository, HelpersAuditService],
})
export class AuditModule {}
