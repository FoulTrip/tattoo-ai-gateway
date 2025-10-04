import { IsEnum, IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { AuditAction, AuditSeverity } from '@prisma/client';

export class CreateAuditDto {
  @IsEnum(AuditAction)
  action: AuditAction;

  @IsEnum(AuditSeverity)
  @IsOptional()
  severity?: AuditSeverity = AuditSeverity.INFO;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  actorId?: string;

  @IsString()
  @IsOptional()
  actorType?: string;

  @IsString()
  @IsOptional()
  actorEmail?: string;

  @IsString()
  @IsOptional()
  actorName?: string;

  @IsString()
  @IsOptional()
  resourceId?: string;

  @IsString()
  @IsOptional()
  resourceType?: string;

  @IsString()
  @IsOptional()
  resourceName?: string;

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsOptional()
  tenantName?: string;

  @IsObject()
  @IsOptional()
  metadata?: any;

  @IsObject()
  @IsOptional()
  oldValues?: any;

  @IsObject()
  @IsOptional()
  newValues?: any;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  endpoint?: string;

  @IsString()
  @IsOptional()
  method?: string;

  @IsBoolean()
  @IsOptional()
  success?: boolean = true;

  @IsString()
  @IsOptional()
  errorCode?: string;

  @IsString()
  @IsOptional()
  errorMessage?: string;
}
