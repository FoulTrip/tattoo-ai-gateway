import { AuditAction, AuditSeverity } from '@prisma/client';

export class AuditEntity {
  id: string;
  action: AuditAction;
  severity: AuditSeverity;
  description: string;
  actorId?: string;
  actorType?: string;
  actorEmail?: string;
  actorName?: string;
  resourceId?: string;
  resourceType?: string;
  resourceName?: string;
  tenantId?: string;
  tenantName?: string;
  metadata?: any;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  timestamp: Date;
  createdAt: Date;

  constructor(partial: Partial<AuditEntity>) {
    Object.assign(this, partial);
  }
}