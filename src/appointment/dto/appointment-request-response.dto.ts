import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentRequestStatus } from '@prisma/client';

export class AppointmentRequestResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the appointment request',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Title of the appointment request',
    example: 'Dragon Tattoo on Arm',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description',
    example: 'I want a realistic dragon tattoo covering my entire forearm',
  })
  description?: string;

  @ApiProperty({
    description: 'Maximum budget the client is willing to pay',
    example: 800.0,
  })
  budget: number;

  @ApiProperty({
    description: 'Array of design image URLs',
    type: [String],
    example: ['https://example.com/design1.jpg', 'https://example.com/design2.jpg'],
  })
  designImages: string[];

  @ApiPropertyOptional({
    description: 'Client preferences',
    example: {
      style: 'realismo',
      bodyPart: 'antebrazo',
      size: 'grande',
    },
  })
  preferences?: Record<string, any>;

  @ApiProperty({
    description: 'Current status of the request',
    enum: AppointmentRequestStatus,
    example: AppointmentRequestStatus.PENDING,
  })
  status: AppointmentRequestStatus;

  @ApiProperty({
    description: 'Expiration date of the request',
    example: '2025-11-01T10:00:00Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Client information',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'John Doe',
      email: 'john@example.com',
    },
  })
  client?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiPropertyOptional({
    description: 'Tenant that accepted the request',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174002',
      name: 'Dragon Tattoo Studio',
    },
  })
  acceptedByTenant?: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-10-17T04:52:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-10-17T04:52:00.000Z',
  })
  updatedAt: Date;
}