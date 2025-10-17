import { ApiProperty } from '@nestjs/swagger';

export class MailResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the sent email',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Email sending status',
    example: 'sent',
    enum: ['sent', 'failed', 'queued'],
  })
  status: 'sent' | 'failed' | 'queued';

  @ApiProperty({
    description: 'Recipient email address',
    example: 'user@example.com',
  })
  to: string;

  @ApiProperty({
    description: 'Email subject',
    example: 'Welcome to our platform',
  })
  subject: string;

  @ApiProperty({
    description: 'Timestamp when the email was sent',
    example: '2025-10-17T04:25:00.000Z',
  })
  sentAt?: Date;

  @ApiProperty({
    description: 'Resend email ID',
    example: '1234567890abcdef',
  })
  resendId?: string;
}