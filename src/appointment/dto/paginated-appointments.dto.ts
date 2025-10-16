import { ApiProperty } from '@nestjs/swagger';
import { AppointmentResponseDto } from './appointment-response.dto';

export class PaginatedAppointmentsDto {
  @ApiProperty({
    description: 'Array of appointments',
    type: [AppointmentResponseDto],
  })
  data: AppointmentResponseDto[];

  @ApiProperty({
    description: 'Total number of appointments',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  totalPages: number;
}
