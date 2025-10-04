import { Prisma } from "@prisma/client";
import { QueryAuditDto } from "../dto/query-audit.dto";
import { AuditRepository } from "../repositories/audit.repositorie";
import { AuditEntity } from "../entities/audit.entity";
import { AuditService } from "../audit.service";

export class ConsultationService {
    constructor(
        private readonly auditRepository: AuditRepository,
        private readonly auditService: AuditService,
    ) {}

    async findAll(query: QueryAuditDto) {
        const { action, severity, actorId, resourceType, resourceId, tenantId, startDate, endDate, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.AuditLogWhereInput = {};

        if (action) where.action = action;
        if (severity) where.severity = severity;
        if (actorId) where.actorId = actorId;
        if (resourceType) where.resourceType = resourceType;
        if (resourceId) where.resourceId = resourceId;
        if (tenantId) where.tenantId = tenantId;

        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp.gte = new Date(startDate);
            if (endDate) where.timestamp.lte = new Date(endDate);
        }

        const [logs, total] = await Promise.all([
            this.auditRepository.findAll({
                skip,
                take: limit,
                where,
                orderBy: { timestamp: 'desc' },
            }),
            this.auditRepository.count(where),
        ]);

        return {
            data: logs.map(log => new AuditEntity(this.auditService.transformAuditLog(log))),
            total,
            page,
            limit,
        };
    }

    async findOne(id: string) {
        const log = await this.auditRepository.findOne(id);
        return log ? new AuditEntity(this.auditService.transformAuditLog(log)) : null;
    }

    async findByResource(resourceType: string, resourceId: string) {
        const logs = await this.auditRepository.findByResource(resourceType, resourceId);
        return logs.map(log => new AuditEntity(this.auditService.transformAuditLog(log)));
    }

    async findByActor(actorId: string, limit: number = 50) {
        const logs = await this.auditRepository.findByActor(actorId, limit);
        return logs.map(log => new AuditEntity(this.auditService.transformAuditLog(log)));
    }

    async findByTenant(tenantId: string, limit: number = 100) {
        const logs = await this.auditRepository.findByTenant(tenantId, limit);
        return logs.map(log => new AuditEntity(this.auditService.transformAuditLog(log)));
    }

    async findSecurityEvents() {
        const logs = await this.auditRepository.findSecurityEvents();
        return logs.map(log => new AuditEntity(this.auditService.transformAuditLog(log)));
    }
}