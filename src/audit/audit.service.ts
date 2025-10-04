import { Injectable, Logger } from '@nestjs/common';
import { AuditRepository } from './repositories/audit.repositorie';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { AuditSeverity, Prisma } from '@prisma/client';
import { AuditEntity } from './entities/audit.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditRepository: AuditRepository) {}

  transformAuditLog(auditLog: any): Partial<AuditEntity> {
    return Object.fromEntries(
      Object.entries(auditLog).map(([key, value]) => [key, value === null ? undefined : value])
    ) as Partial<AuditEntity>;
  }

  // Método principal para crear logs de auditoría
  async log(dto: CreateAuditDto): Promise<AuditEntity | null> {
    try {
      const data: Prisma.AuditLogCreateInput = {
        action: dto.action,
        severity: dto.severity || AuditSeverity.INFO,
        description: dto.description,
        actorId: dto.actorId,
        actorType: dto.actorType || 'USER',
        actorEmail: dto.actorEmail,
        actorName: dto.actorName,
        resourceId: dto.resourceId,
        resourceType: dto.resourceType,
        resourceName: dto.resourceName,
        tenantId: dto.tenantId,
        tenantName: dto.tenantName,
        metadata: dto.metadata || undefined,
        oldValues: dto.oldValues || undefined,
        newValues: dto.newValues || undefined,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        endpoint: dto.endpoint,
        method: dto.method,
        success: dto.success ?? true,
        errorCode: dto.errorCode,
        errorMessage: dto.errorMessage,
      };

      const auditLog = await this.auditRepository.create(data);
      this.logger.debug(`AuditLog created: ${JSON.stringify(auditLog)}`);
      this.logger.debug(`AuditLog actorId: ${auditLog.actorId}, type: ${typeof auditLog.actorId}`);
      return new AuditEntity(this.transformAuditLog(auditLog));
    } catch (error) {
      this.logger.error(`Error creating audit log: ${error.message}`, error.stack);
      // No lanzamos el error para no afectar el flujo principal
      return null;
    }
  }

  async create(createAuditDto: CreateAuditDto) {
    return this.log(createAuditDto);
  }

  async findAll() {
    const auditLogs = await this.auditRepository.findAll({});
    return auditLogs.map(log => new AuditEntity(this.transformAuditLog(log)));
  }

  async findOne(id: string) {
    const auditLog = await this.auditRepository.findOne(id);
    if (!auditLog) {
      throw new Error('Audit log not found');
    }
    return new AuditEntity(this.transformAuditLog(auditLog));
  }

  async update(id: string, updateAuditDto: UpdateAuditDto) {
    // Audit logs are immutable, so update is not supported
    throw new Error('Audit logs cannot be updated');
  }

  async remove(id: string) {
    // Audit logs should not be deleted for compliance reasons
    throw new Error('Audit logs cannot be deleted');
  }
}
