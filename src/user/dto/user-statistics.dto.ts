import { ApiProperty } from '@nestjs/swagger';

export class UserStatisticsDto {
  @ApiProperty({
    description: 'Total number of users',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'User count by type',
    example: {
      tatuadores: 50,
      clientes: 100,
    },
  })
  byType: {
    tatuadores: number;
    clientes: number;
  };

  @ApiProperty({
    description: 'Percentage distribution by type',
    example: {
      tatuadores: 33.33,
      clientes: 66.67,
    },
  })
  percentages: {
    tatuadores: number;
    clientes: number;
  };
}