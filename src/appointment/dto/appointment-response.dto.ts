import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';

export class AppointmentResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the appointment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Title of the appointment',
    example: 'Dragon Tattoo Session',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the appointment',
    example: 'Full back dragon tattoo, first session',
  })
  description?: string;

  @ApiProperty({
    description: 'Start time of the appointment',
    example: '2025-11-01T10:00:00Z',
  })
  startTime: Date;

  @ApiProperty({
    description: 'End time of the appointment',
    example: '2025-11-01T14:00:00Z',
  })
  endTime: Date;

  @ApiProperty({
    description: 'Status of the appointment',
    enum: AppointmentStatus,
    example: AppointmentStatus.CONFIRMED,
  })
  status: AppointmentStatus;

  @ApiPropertyOptional({
    description: 'Deposit amount paid',
    example: 100.0,
  })
  deposit?: number;

  @ApiPropertyOptional({
    description: 'Total price of the service',
    example: 500.0,
  })
  totalPrice?: number;

  @ApiPropertyOptional({
    description: 'Additional notes for the appointment',
    example: 'Client prefers afternoon sessions',
  })
  notes?: string;

  @ApiProperty({
    description: 'Array of design image URLs',
    type: [String],
    example: ['https://example.com/design1.jpg'],
  })
  designImages: string[];

  @ApiProperty({
    description: 'ID of the tenant (studio)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  tenantId: string;

  @ApiProperty({
    description: 'ID of the calendar',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  calendarId: string;

  @ApiProperty({
    description: 'ID of the client user',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  clientId: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-10-15T08:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-10-15T08:30:00Z',
  })
  updatedAt: Date;
}
