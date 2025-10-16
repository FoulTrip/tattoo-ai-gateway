import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsNumber,
  IsArray,
  IsUUID,
  IsEnum,
  Min,
} from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'Title of the appointment',
    example: 'Dragon Tattoo Session',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the appointment',
    example: 'Full back dragon tattoo, first session',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Start time of the appointment (ISO 8601 format)',
    example: '2025-11-01T10:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'End time of the appointment (ISO 8601 format)',
    example: '2025-11-01T14:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({
    description: 'Status of the appointment',
    enum: AppointmentStatus,
    example: AppointmentStatus.PENDING,
    default: AppointmentStatus.PENDING,
  })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    description: 'Deposit amount paid',
    example: 100.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  deposit?: number;

  @ApiPropertyOptional({
    description: 'Total price of the service',
    example: 500.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalPrice?: number;

  @ApiPropertyOptional({
    description: 'Additional notes for the appointment',
    example: 'Client prefers afternoon sessions',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Array of design image URLs',
    type: [String],
    example: ['https://example.com/design1.jpg', 'https://example.com/design2.jpg'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  designImages?: string[];

  @ApiProperty({
    description: 'ID of the tenant (studio) for this appointment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({
    description: 'ID of the calendar where this appointment will be scheduled',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  calendarId: string;

  @ApiProperty({
    description: 'ID of the client user',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsNotEmpty()
  clientId: string;
}
