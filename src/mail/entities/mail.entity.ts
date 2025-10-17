export class MailEntity {
  id: string;
  to: string;
  cc: string[];
  bcc: string[];
  subject: string;
  html?: string | null;
  text?: string | null;
  template?: string | null;
  templateData?: any;
  status: string;
  resendId?: string | null;
  errorMessage?: string | null;
  sentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<MailEntity>) {
    Object.assign(this, partial);
  }

  // Métodos de negocio
  isSent(): boolean {
    return this.status === 'sent';
  }

  isFailed(): boolean {
    return this.status === 'failed';
  }

  isQueued(): boolean {
    return this.status === 'queued';
  }

  markAsSent(resendId?: string): void {
    this.status = 'sent';
    this.sentAt = new Date();
    this.resendId = resendId;
    this.updatedAt = new Date();
  }

  markAsFailed(errorMessage: string): void {
    this.status = 'failed';
    this.errorMessage = errorMessage;
    this.updatedAt = new Date();
  }

  markAsQueued(): void {
    this.status = 'queued';
    this.updatedAt = new Date();
  }
}