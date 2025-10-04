import { Injectable } from "@nestjs/common";
import { AuditAction, AuditSeverity } from '@prisma/client';
import { AuditService } from "../audit.service";

export interface AuditContext {
    actorId?: string;
    actorEmail?: string;
    actorName?: string;
    tenantId?: string;
    tenantName?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
}

@Injectable()
export class HelpersAuditService {

    constructor(
        private readonly audit: AuditService,
    ) { }

    // Usuario

    async logUserCreated(userId: string, userEmail: string, userName: string, context?: AuditContext) {
        return this.audit.log({
            action: AuditAction.USER_CREATED,
            severity: AuditSeverity.INFO,
            description: `Usuario creado: ${userEmail}`,
            resourceId: userId,
            resourceType: 'USER',
            resourceName: userName,
            ...context,
        });
    }

    async logUserUpdated(userId: string, oldValues: any, newValues: any, context?: AuditContext) {
        return this.audit.log({
            action: AuditAction.USER_UPDATED,
            severity: AuditSeverity.INFO,
            description: `Usuario actualizado`,
            resourceId: userId,
            resourceType: 'USER',
            oldValues,
            newValues,
            ...context,
        });
    }

    async logUserDeleted(userId: string, userName: string, context?: AuditContext) {
        return this.audit.log({
            action: AuditAction.USER_DELETED,
            severity: AuditSeverity.WARNING,
            description: `Usuario eliminado: ${userName}`,
            resourceId: userId,
            resourceType: 'USER',
            resourceName: userName,
            ...context,
        });
    }

    async logUserLogin(userId: string, userEmail: string, success: boolean = true, context?: AuditContext) {
        return this.audit.log({
            action: AuditAction.USER_LOGIN,
            severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
            description: success ? `Login exitoso: ${userEmail}` : `Login fallido: ${userEmail}`,
            resourceId: userId,
            resourceType: 'USER',
            success,
            ...context,
        });
    }

    // Tenant

    async logTenantCreated(tenantId: string, tenantName: string, ownerId: string, context?: AuditContext) {
        return this.audit.log({
            action: AuditAction.TENANT_CREATED,
            severity: AuditSeverity.INFO,
            description: `Tenant creado: ${tenantName}`,
            resourceId: tenantId,
            resourceType: 'TENANT',
            resourceName: tenantName,
            tenantId,
            tenantName,
            actorId: ownerId,
            ...context,
        });
    }

    async logTenantUpdated(tenantId: string, oldValues: any, newValues: any, context?: AuditContext) {
        return this.audit.log({
            action: AuditAction.TENANT_UPDATED,
            severity: AuditSeverity.INFO,
            description: `Tenant actualizado`,
            resourceId: tenantId,
            resourceType: 'TENANT',
            tenantId,
            oldValues,
            newValues,
            ...context,
        });
    }

    // Citas

    async logAppointmentCreated(appointmentId: string, clientId: string, tenantId: string, metadata?: any, context?: AuditContext) {
        return this.audit.log({
            action: AuditAction.APPOINTMENT_CREATED,
            severity: AuditSeverity.INFO,
            description: `Cita creada`,
            resourceId: appointmentId,
            resourceType: 'APPOINTMENT',
            tenantId,
            actorId: clientId,
            metadata,
            ...context,
        });
    }

    async logAppointmentConfirmed(appointmentId: string, tenantId: string, context?: AuditContext) {
        return this.audit.log({
            action: AuditAction.APPOINTMENT_CONFIRMED,
            severity: AuditSeverity.INFO,
            description: `Cita confirmada`,
            resourceId: appointmentId,
            resourceType: 'APPOINTMENT',
            tenantId,
            ...context,
        });
    }

    async logAppointmentCancelled(appointmentId: string, tenantId: string, reason?: string, context?: AuditContext) {
        return this.audit.log({
            action: AuditAction.APPOINTMENT_CANCELLED,
            severity: AuditSeverity.WARNING,
            description: `Cita cancelada${reason ? `: ${reason}` : ''}`,
            resourceId: appointmentId,
            resourceType: 'APPOINTMENT',
            tenantId,
            metadata: reason ? { reason } : undefined,
            ...context,
        });
    }

    // Diseños

    async logDesignCreated(designId: string, designTitle: string, tenantId: string, context?: AuditContext) {
        return this.audit.log({
            action: AuditAction.DESIGN_CREATED,
            severity: AuditSeverity.INFO,
            description: `Diseño creado: ${designTitle}`,
            resourceId: designId,
            resourceType: 'DESIGN',
            resourceName: designTitle,
            tenantId,
            ...context,
        });
    }

    async logDesignVisibilityChanged(designId: string, oldVisibility: string, newVisibility: string, tenantId: string, context?: AuditContext) {
        return this.audit.log({
            action: AuditAction.DESIGN_VISIBILITY_CHANGED,
            severity: AuditSeverity.INFO,
            description: `Visibilidad de diseño cambiada de ${oldVisibility} a ${newVisibility}`,
            resourceId: designId,
            resourceType: 'DESIGN',
            tenantId,
            oldValues: { visibility: oldVisibility },
            newValues: { visibility: newVisibility },
            ...context,
        });
    }

    // Pagos

    async logPaymentReceived(appointmentId: string, amount: number, tenantId: string, context?: AuditContext) {
        return this.audit.log({
            action: AuditAction.PAYMENT_DEPOSIT_RECEIVED,
            severity: AuditSeverity.INFO,
            description: `Pago recibido: $${amount}`,
            resourceId: appointmentId,
            resourceType: 'PAYMENT',
            tenantId,
            metadata: { amount },
            ...context,
        });
    }

    async logPaymentFailed(appointmentId: string, amount: number, errorMessage: string, tenantId: string, context?: AuditContext) {
        return this.audit.log({
            action: AuditAction.PAYMENT_FAILED,
            severity: AuditSeverity.ERROR,
            description: `Pago fallido: $${amount}`,
            resourceId: appointmentId,
            resourceType: 'PAYMENT',
            tenantId,
            success: false,
            errorMessage,
            metadata: { amount },
            ...context,
        });
    }

    // Seguridad

    async logSuspiciousLogin(email: string, ipAddress: string, attempts: number) {
        return this.audit.log({
            action: AuditAction.SECURITY_SUSPICIOUS_LOGIN,
            severity: AuditSeverity.WARNING,
            description: `Intentos de login sospechosos: ${attempts}`,
            actorEmail: email,
            resourceType: 'SECURITY',
            ipAddress,
            metadata: { attempts },
        });
    }

    async logAccountLocked(userId: string, reason: string, context?: AuditContext) {
        return this.audit.log({
            action: AuditAction.SECURITY_ACCOUNT_LOCKED,
            severity: AuditSeverity.CRITICAL,
            description: `Cuenta bloqueada: ${reason}`,
            resourceId: userId,
            resourceType: 'SECURITY',
            metadata: { reason },
            ...context,
        });
    }
}