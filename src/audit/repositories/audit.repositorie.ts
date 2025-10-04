import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLog, Prisma } from '@prisma/client';

@Injectable()
export class AuditRepository {
    private readonly logger = new Logger(AuditRepository.name);

    constructor(private readonly prisma: PrismaService) { }

    async create(data: Prisma.AuditLogCreateInput): Promise<AuditLog> {
        try {
            return await this.prisma.auditLog.create({ data });
        } catch (error) {
            this.logger.error(`Error creating audit log: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.AuditLogWhereInput;
        orderBy?: Prisma.AuditLogOrderByWithRelationInput;
    }): Promise<AuditLog[]> {
        const { skip, take, where, orderBy } = params;
        try {
            return await this.prisma.auditLog.findMany({
                skip,
                take,
                where,
                orderBy,
            });
        } catch (error) {
            this.logger.error(`Error finding audit logs: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findOne(id: string): Promise<AuditLog | null> {
        try {
            return await this.prisma.auditLog.findUnique({
                where: { id },
            });
        } catch (error) {
            this.logger.error(`Error finding audit log: ${error.message}`, error.stack);
            throw error;
        }
    }

    async count(where?: Prisma.AuditLogWhereInput): Promise<number> {
        try {
            return await this.prisma.auditLog.count({ where });
        } catch (error) {
            this.logger.error(`Error counting audit logs: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findByResource(resourceType: string, resourceId: string): Promise<AuditLog[]> {
        try {
            return await this.prisma.auditLog.findMany({
                where: {
                    resourceType,
                    resourceId,
                },
                orderBy: { timestamp: 'asc' },
            });
        } catch (error) {
            this.logger.error(`Error finding audit logs by resource: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findByActor(actorId: string, limit: number = 50): Promise<AuditLog[]> {
        try {
            return await this.prisma.auditLog.findMany({
                where: { actorId },
                orderBy: { timestamp: 'desc' },
                take: limit,
            });
        } catch (error) {
            this.logger.error(`Error finding audit logs by actor: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findByTenant(tenantId: string, limit: number = 100): Promise<AuditLog[]> {
        try {
            return await this.prisma.auditLog.findMany({
                where: { tenantId },
                orderBy: { timestamp: 'desc' },
                take: limit,
            });
        } catch (error) {
            this.logger.error(`Error finding audit logs by tenant: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findSecurityEvents(): Promise<AuditLog[]> {
        try {
            return await this.prisma.auditLog.findMany({
                where: {
                    OR: [
                        { severity: 'CRITICAL' },
                        { severity: 'ERROR' },
                        {
                            action: {
                                in: [
                                    'SECURITY_SUSPICIOUS_LOGIN',
                                    'SECURITY_ACCOUNT_LOCKED',
                                    'SECURITY_ACCOUNT_UNLOCKED',
                                ],
                            },
                        },
                    ],
                },
                orderBy: { timestamp: 'desc' },
                take: 100,
            });
        } catch (error) {
            this.logger.error(`Error finding security events: ${error.message}`, error.stack);
            throw error;
        }
    }
}