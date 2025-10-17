import { MailEntity } from '../entities/mail.entity';

export interface IMailRepository {
  create(mail: Partial<MailEntity>): Promise<MailEntity>;
  findById(id: string): Promise<MailEntity | null>;
  findAll(limit?: number, offset?: number): Promise<MailEntity[]>;
  update(id: string, mail: Partial<MailEntity>): Promise<MailEntity>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}