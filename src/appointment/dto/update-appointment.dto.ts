import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  Min,
} from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({
    description: 'Title of the appointment',
    example: 'Dragon Tattoo Session - Updated',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the appointment',
    example: 'Full back dragon tattoo, second session',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Start time of the appointment (ISO 8601 format)',
    example: '2025-11-01T10:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time of the appointment (ISO 8601 format)',
    example: '2025-11-01T14:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Status of the appointment',
    enum: AppointmentStatus,
    example: AppointmentStatus.CONFIRMED,
  })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    description: 'Deposit amount paid',
    example: 150.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  deposit?: number;

  @ApiPropertyOptional({
    description: 'Total price of the service',
    example: 600.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalPrice?: number;

  @ApiPropertyOptional({
    description: 'Additional notes for the appointment',
    example: 'Client requested color change',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Array of design image URLs',
    type: [String],
    example: ['https://example.com/design1.jpg'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  designImages?: string[];
}
