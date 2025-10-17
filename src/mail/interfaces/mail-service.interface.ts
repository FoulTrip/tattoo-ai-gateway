import { MailEntity } from '../entities/mail.entity';
import { SendMailDto } from '../dto/send-mail.dto';

export interface IMailService {
  sendMail(dto: SendMailDto): Promise<MailEntity>;
  sendBulkMail(dtos: SendMailDto[]): Promise<MailEntity[]>;
  getMailHistory(limit?: number, offset?: number): Promise<MailEntity[]>;
  getMailById(id: string): Promise<MailEntity | null>;
}