import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '@prisma/client';

export class QueryAppointmentDto {
  @ApiPropertyOptional({
    description: 'Filter by tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Filter by calendar ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  @IsOptional()
  calendarId?: string;

  @ApiPropertyOptional({
    description: 'Filter by client ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Filter by appointment status',
    enum: AppointmentStatus,
    example: AppointmentStatus.CONFIRMED,
  })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    description: 'Filter appointments starting from this date (ISO 8601 format)',
    example: '2025-11-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter appointments ending before this date (ISO 8601 format)',
    example: '2025-11-30T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Search term for title or description',
    example: 'dragon',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
