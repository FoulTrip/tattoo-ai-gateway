import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { MailService } from './services/mail.service';
import { SendMailDto } from './dto/send-mail.dto';
import { MailResponseDto } from './dto/mail-response.dto';
import { MailEntity } from './entities/mail.entity';

@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  @ApiOperation({
    summary: 'Send an email',
    description: 'Sends an email using the configured mail service (Resend). Supports HTML and text content, CC/BCC recipients, and template rendering.',
  })
  @ApiCreatedResponse({
    description: 'Email sent successfully',
    type: MailResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or missing required fields',
  })
  async sendMail(@Body() sendMailDto: SendMailDto): Promise<MailResponseDto> {
    const result = await this.mailService.sendMail(sendMailDto);
    return this.mapToResponseDto(result);
  }

  @Post('send-bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send bulk emails',
    description: 'Sends multiple emails in batch. Continues processing even if some emails fail.',
  })
  @ApiOkResponse({
    description: 'Bulk emails processed',
    type: [MailResponseDto],
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async sendBulkMail(@Body() sendMailDtos: SendMailDto[]): Promise<MailResponseDto[]> {
    const results = await this.mailService.sendBulkMail(sendMailDtos);
    return results.map(result => this.mapToResponseDto(result));
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get email history',
    description: 'Retrieves paginated list of sent emails with their status and details.',
  })
  @ApiOkResponse({
    description: 'Email history retrieved successfully',
    type: [MailResponseDto],
  })
  async getMailHistory(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<MailResponseDto[]> {
    const mails = await this.mailService.getMailHistory(limit, offset);
    return mails.map(mail => this.mapToResponseDto(mail));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get email by ID',
    description: 'Retrieves details of a specific email by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Email ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Email found',
    type: MailResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Email not found',
  })
  async getMailById(@Param('id') id: string): Promise<MailResponseDto> {
    const mail = await this.mailService.getMailById(id);
    if (!mail) {
      throw new Error('Email not found');
    }
    return this.mapToResponseDto(mail);
  }

  private mapToResponseDto(mail: MailEntity): MailResponseDto {
    return {
      id: mail.id,
      status: mail.status as 'sent' | 'failed' | 'queued',
      to: mail.to,
      subject: mail.subject,
      sentAt: mail.sentAt || undefined,
      resendId: mail.resendId || undefined,
    };
  }
}