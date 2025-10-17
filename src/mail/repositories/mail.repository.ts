import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailEntity } from '../entities/mail.entity';
import { IMailRepository } from '../interfaces/mail-repository.interface';

@Injectable()
export class MailRepository implements IMailRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(mail: Partial<MailEntity>): Promise<MailEntity> {
    const data = {
      id: mail.id || undefined,
      to: mail.to!,
      cc: mail.cc || [],
      bcc: mail.bcc || [],
      subject: mail.subject!,
      html: mail.html,
      text: mail.text,
      template: mail.template,
      templateData: mail.templateData,
      status: mail.status || 'queued',
      resendId: mail.resendId,
      errorMsg: mail.errorMessage,
      sentAt: mail.sentAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const created = await this.prisma.mail.create({
      data,
    });

    return new MailEntity(created);
  }

  async findById(id: string): Promise<MailEntity | null> {
    const mail = await this.prisma.mail.findUnique({
      where: { id },
    });

    return mail ? new MailEntity(mail) : null;
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<MailEntity[]> {
    const mails = await this.prisma.mail.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return mails.map(mail => new MailEntity(mail));
  }

  async update(id: string, mail: Partial<MailEntity>): Promise<MailEntity> {
    const data = {
      ...mail,
      errorMsg: mail.errorMessage,
      updatedAt: new Date(),
    };

    const updated = await this.prisma.mail.update({
      where: { id },
      data,
    });

    return new MailEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.mail.delete({
      where: { id },
    });
  }

  async count(): Promise<number> {
    return this.prisma.mail.count();
  }
}