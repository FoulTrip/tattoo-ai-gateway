import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  IsObject,
  Min,
} from 'class-validator';

export class CreateAppointmentRequestDto {
  @ApiProperty({
    description: 'Title of the appointment request',
    example: 'Dragon Tattoo on Arm',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of what the client wants',
    example: 'I want a realistic dragon tattoo covering my entire forearm',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Maximum budget the client is willing to pay',
    example: 800.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  budget: number;

  @ApiProperty({
    description: 'Array of design image URLs that the client likes',
    type: [String],
    example: ['https://example.com/design1.jpg', 'https://example.com/design2.jpg'],
  })
  @IsArray()
  @IsString({ each: true })
  designImages: string[];

  @ApiPropertyOptional({
    description: 'Client preferences as JSON object',
    example: {
      style: 'realismo',
      bodyPart: 'antebrazo',
      size: 'grande',
      painTolerance: 'media',
    },
  })
  @IsObject()
  @IsOptional()
  preferences?: Record<string, any>;
}