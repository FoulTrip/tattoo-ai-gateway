import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { SendMailDto } from '../dto/send-mail.dto';
import { MailEntity } from '../entities/mail.entity';
import { MailRepository } from '../repositories/mail.repository';
import type { IMailService } from '../interfaces/mail-service.interface';

@Injectable()
export class MailService implements IMailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;

  constructor(
    private readonly configService: ConfigService,
    private readonly mailRepository: MailRepository,
  ) {
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    this.resend = new Resend(resendApiKey);
  }

  async sendMail(dto: SendMailDto): Promise<MailEntity> {
    // Crear registro inicial en la base de datos
    const mailEntity = new MailEntity({
      to: dto.to,
      cc: dto.cc,
      bcc: dto.bcc,
      subject: dto.subject,
      html: dto.html,
      text: dto.text,
      template: dto.template,
      templateData: dto.templateData,
      status: 'queued',
    });

    const savedMail = await this.mailRepository.create(mailEntity);

    try {
      // Preparar datos para Resend
      const resendData: any = {
        from: this.configService.get<string>('MAIL_FROM', 'noreply@tattoo-ai.com'),
        to: dto.to,
        subject: dto.subject,
      };

      // Agregar CC si existe
      if (dto.cc && dto.cc.length > 0) {
        resendData.cc = dto.cc;
      }

      // Agregar BCC si existe
      if (dto.bcc && dto.bcc.length > 0) {
        resendData.bcc = dto.bcc;
      }

      // Agregar contenido HTML o texto
      if (dto.html) {
        resendData.html = dto.html;
      } else if (dto.text) {
        resendData.text = dto.text;
      }

      // Si hay template, procesarlo
      if (dto.template && dto.templateData) {
        resendData.html = this.processTemplate(dto.template, dto.templateData);
      }

      // Enviar correo con Resend
      const result = await this.resend.emails.send(resendData);

      // Actualizar registro como enviado
      savedMail.markAsSent(result.data?.id);
      await this.mailRepository.update(savedMail.id, savedMail);

      this.logger.log(`Email sent successfully: ${savedMail.id}`);
      return savedMail;

    } catch (error) {
      // Actualizar registro como fallido
      savedMail.markAsFailed(error.message || 'Unknown error');
      await this.mailRepository.update(savedMail.id, savedMail);

      this.logger.error(`Failed to send email: ${savedMail.id}`, error);
      throw error;
    }
  }

  async sendBulkMail(dtos: SendMailDto[]): Promise<MailEntity[]> {
    const results: MailEntity[] = [];

    for (const dto of dtos) {
      try {
        const result = await this.sendMail(dto);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to send bulk email to ${dto.to}`, error);
        // Continuar con el siguiente correo aunque uno falle
      }
    }

    return results;
  }

  async getMailHistory(limit: number = 50, offset: number = 0): Promise<MailEntity[]> {
    return this.mailRepository.findAll(limit, offset);
  }

  async getMailById(id: string): Promise<MailEntity | null> {
    return this.mailRepository.findById(id);
  }

  private processTemplate(templateName: string, data: Record<string, any>): string {
    // Aquí podrías implementar lógica para cargar templates desde archivos
    // o usar un motor de templates como Handlebars
    // Por ahora, un ejemplo simple de reemplazo
    let template = this.getTemplateContent(templateName);

    // Reemplazar variables en el template
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, data[key]);
    });

    return template;
  }

  private getTemplateContent(templateName: string): string {
    // Aquí cargarías el template desde archivos o base de datos
    // Ejemplo simple
    const templates: Record<string, string> = {
      'welcome': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Bienvenido a Tattoo AI</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Bienvenido a Tattoo AI!</h1>
            </div>
            <div class="content">
              <h2>Hola {{name}},</h2>
              <p>¡Gracias por registrarte en <strong>Tattoo AI</strong>! Tu cuenta ha sido creada exitosamente.</p>
              <p>Ahora puedes:</p>
              <ul>
                <li>Gestionar tus citas de tatuaje</li>
                <li>Explorar diseños de artistas</li>
                <li>Conectar con tatuadores profesionales</li>
                <li>Administrar tu estudio (si eres tatuador)</li>
              </ul>
              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
              <p>¡Esperamos que disfrutes tu experiencia con nosotros!</p>
              <p style="margin-top: 30px;">Saludos,<br>El equipo de Tattoo AI</p>
            </div>
          </div>
        </body>
        </html>
      `,
      'appointment-confirmation': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Confirmación de Cita</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .appointment-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Confirmación de Cita</h1>
            </div>
            <div class="content">
              <h2>Hola {{clientName}},</h2>
              <p>Tu cita ha sido confirmada exitosamente. Aquí están los detalles:</p>

              <div class="appointment-details">
                <h3>Detalles de la Cita</h3>
                <p><strong>Fecha:</strong> {{date}}</p>
                <p><strong>Hora:</strong> {{time}}</p>
                <p><strong>Servicio:</strong> {{service}}</p>
                <p><strong>Artista:</strong> {{artist}}</p>
              </div>

              <p>Te esperamos en el estudio. Si necesitas cambiar la cita o tienes alguna pregunta, por favor contacta al artista directamente.</p>

              <p style="margin-top: 30px;">Saludos,<br>El equipo de Tattoo AI</p>
            </div>
          </div>
        </body>
        </html>
      `,
      'new-appointment-request': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Nueva Solicitud de Cita</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .request-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nueva Solicitud de Cita</h1>
            </div>
            <div class="content">
              <h2>Hola {{tenantName}},</h2>
              <p>Has recibido una nueva solicitud de cita de un cliente. Aquí están los detalles:</p>

              <div class="request-details">
                <h3>Detalles de la Solicitud</h3>
                <p><strong>Cliente:</strong> {{clientName}}</p>
                <p><strong>Título:</strong> {{requestTitle}}</p>
                <p><strong>Presupuesto máximo:</strong> $\{{budget}}</p>
                <p><strong>Imágenes de diseño:</strong> {{designImagesCount}} imágenes</p>
              </div>

              <p>Esta solicitud está disponible para que cualquier tenant la acepte. El primero en aceptarla se queda con el cliente.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="#" class="button">Ver Solicitud Completa</a>
                <a href="#" class="button">Aceptar Solicitud</a>
              </div>

              <p style="margin-top: 30px;">Saludos,<br>El equipo de Tattoo AI</p>
            </div>
          </div>
        </body>
        </html>
      `,
      'appointment-request-accepted': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Solicitud de Cita Aceptada</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .tenant-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10B981; }
            .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Tu Solicitud ha sido Aceptada!</h1>
            </div>
            <div class="content">
              <h2>Hola {{clientName}},</h2>
              <p>¡Excelentes noticias! Tu solicitud de cita ha sido aceptada por un artista.</p>

              <div class="tenant-info">
                <h3>Información del Artista</h3>
                <p><strong>Estudio:</strong> {{tenantName}}</p>
                <p><strong>Email:</strong> {{tenantEmail}}</p>
                <p><strong>Teléfono:</strong> {{tenantPhone}}</p>
              </div>

              <p>El artista se pondrá en contacto contigo pronto para coordinar los detalles de tu cita y seleccionar una fecha disponible en su calendario.</p>

              <p>¡Estamos emocionados de que pronto tengas tu nuevo tatuaje!</p>

              <p style="margin-top: 30px;">Saludos,<br>El equipo de Tattoo AI</p>
            </div>
          </div>
        </body>
        </html>
      `,
      'appointment-scheduled': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Cita Agendada</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .appointment-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #F59E0B; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Tu Cita ha sido Agendada</h1>
            </div>
            <div class="content">
              <h2>Hola {{clientName}},</h2>
              <p>Tu cita ha sido agendada exitosamente. Aquí están los detalles:</p>

              <div class="appointment-details">
                <h3>Detalles de la Cita</h3>
                <p><strong>Servicio:</strong> {{appointmentTitle}}</p>
                <p><strong>Fecha y Hora:</strong> {{startTime}}</p>
                <p><strong>Artista:</strong> {{tenantName}}</p>
              </div>

              <p>Por favor llega 15 minutos antes de tu cita. Si necesitas cambiar la fecha o tienes alguna pregunta, contacta directamente al artista.</p>

              <p>¡Te esperamos para crear algo increíble!</p>

              <p style="margin-top: 30px;">Saludos,<br>El equipo de Tattoo AI</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    return templates[templateName] || '<p>Template not found</p>';
  }
}