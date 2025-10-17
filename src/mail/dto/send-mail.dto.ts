import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsArray,
  IsOptional,
  IsObject,
} from 'class-validator';

export class SendMailDto {
  @ApiProperty({
    description: 'Recipient email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiPropertyOptional({
    description: 'CC recipients',
    type: [String],
    example: ['cc@example.com'],
  })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  cc?: string[];

  @ApiPropertyOptional({
    description: 'BCC recipients',
    type: [String],
    example: ['bcc@example.com'],
  })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  bcc?: string[];

  @ApiProperty({
    description: 'Email subject',
    example: 'Welcome to our platform',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional({
    description: 'HTML content of the email',
    example: '<h1>Hello!</h1><p>This is a test email.</p>',
  })
  @IsString()
  @IsOptional()
  html?: string;

  @ApiPropertyOptional({
    description: 'Plain text content of the email',
    example: 'Hello! This is a test email.',
  })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiPropertyOptional({
    description: 'Additional data for template rendering',
    example: { name: 'John Doe', verificationLink: 'https://example.com/verify' },
  })
  @IsObject()
  @IsOptional()
  templateData?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Template name to use',
    example: 'welcome-email',
  })
  @IsString()
  @IsOptional()
  template?: string;
}