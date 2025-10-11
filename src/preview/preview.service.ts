import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PreviewGateway } from './preview.gateway';
import { firstValueFrom } from 'rxjs';
import FormData from 'form-data';
import { ExternalBackendResponse } from './interfaces/external-backend-response.interface';

@Injectable()
export class PreviewService {
  private readonly logger = new Logger(PreviewService.name);
  private readonly externalBackendUrl: string;
  private jobToUser: Map<string, string> = new Map();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => PreviewGateway))
    private readonly previewGateway: PreviewGateway,
  ) {
    this.externalBackendUrl = this.configService.get<string>(
      'EXTERNAL_BACKEND_URL',
      'http://localhost:5000/api/process',
    );
    this.logger.log(`External backend URL: ${this.externalBackendUrl}`);
  }

  async processImages(
    files: Array<Express.Multer.File>,
    userId: string,
  ): Promise<string> {
    try {
      const jobId = await this.sendToExternalBackend(files, userId);
      this.logger.log(`Started job ${jobId} for user ${userId}`);
      return jobId;
    } catch (error) {
      this.logger.error(`Error starting job for user ${userId}:`, error.message);
      throw error;
    }
  }

  private async sendToExternalBackend(
    files: Array<Express.Multer.File>,
    userId: string,
  ): Promise<string> {
    try {
      // Preparar FormData con las imágenes
      const formData = new FormData();
      formData.append('body_image', files[0].buffer, {
        filename: files[0].originalname,
        contentType: files[0].mimetype,
      });
      formData.append('tattoo_image', files[1].buffer, {
        filename: files[1].originalname,
        contentType: files[1].mimetype,
      });

      this.logger.log(`Sending images to external backend for user ${userId}`);

      // Enviar al backend externo
      const response = await firstValueFrom(
        this.httpService.post<ExternalBackendResponse>(
          this.externalBackendUrl,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
            timeout: 300000, // 5 minutos de timeout
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
          },
        ),
      );

      this.logger.log(`Received response from external backend`);

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Unknown error');
      }

      const jobId = response.data.body_image.filename.split('_')[1]; // Extract uuid from "body_uuid"
      this.jobToUser.set(jobId, userId);

      // Notificar que comenzó el procesamiento
      this.previewGateway.sendProcessingStarted(userId, jobId);

      return jobId;
    } catch (error) {
      this.logger.error(
        `Error in sendToExternalBackend for user ${userId}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  getUserForJob(jobId: string): string | undefined {
    return this.jobToUser.get(jobId);
  }
}