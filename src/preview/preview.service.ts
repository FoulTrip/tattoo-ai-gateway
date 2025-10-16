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
  private jobToSocket: Map<string, string> = new Map();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => PreviewGateway))
    private readonly previewGateway: PreviewGateway,
  ) {
    this.externalBackendUrl = this.configService.get<string>(
      'EXTERNAL_BACKEND_URL',
      'http://localhost:8000/upload/',
    );
    this.logger.log(`External backend URL: ${this.externalBackendUrl}`);
  }

  async processImages(
    files: Array<Express.Multer.File>,
    socketId: string,
  ): Promise<string> {
    try {
      const jobId = await this.sendToExternalBackend(files, socketId);
      this.logger.log(`Started job ${jobId} for socket ${socketId}`);
      return jobId;
    } catch (error) {
      this.logger.error(`Error starting job for socket ${socketId}:`, error.message);
      throw error;
    }
  }

  private async sendToExternalBackend(
    files: Array<Express.Multer.File>,
    socketId: string,
  ): Promise<string> {
    try {
      // Preparar FormData con las imágenes y socketId
      const formData = new FormData();
      formData.append('body_image', files[0].buffer, {
        filename: files[0].originalname,
        contentType: files[0].mimetype,
      });
      formData.append('tattoo_image', files[1].buffer, {
        filename: files[1].originalname,
        contentType: files[1].mimetype,
      });
      formData.append('socket_id', socketId);

      this.logger.log(`FormData prepared with:`);
      this.logger.log(`- body_image: ${files[0].originalname} (${files[0].mimetype}, ${files[0].buffer.length} bytes)`);
      this.logger.log(`- tattoo_image: ${files[1].originalname} (${files[1].mimetype}, ${files[1].buffer.length} bytes)`);
      this.logger.log(`- socket_id: ${socketId}`);
      this.logger.log(`FormData headers: ${JSON.stringify(formData.getHeaders())}`);

      this.logger.log(`Sending images to external backend for socket ${socketId}`);

      // Enviar al backend externo
      this.logger.log(`Making POST request to: ${this.externalBackendUrl}`);
      const requestConfig = {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 300000, // 5 minutos de timeout
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      };
      this.logger.log(`Request config: ${JSON.stringify(requestConfig)}`);

      const response = await firstValueFrom(
        this.httpService.post<ExternalBackendResponse>(
          this.externalBackendUrl,
          formData,
          requestConfig,
        ),
      );

      this.logger.log(`Received response from external backend:`);
      this.logger.log(`- Status: ${response.status}`);
      this.logger.log(`- Status text: ${response.statusText}`);
      this.logger.log(`- Headers: ${JSON.stringify(response.headers)}`);
      this.logger.log(`- Data: ${JSON.stringify(response.data)}`);

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Unknown error');
      }

      const jobId = response.data.body_image.filename.split('_')[1];
      this.jobToSocket.set(jobId, socketId);

      // Notificar que comenzó el procesamiento
      this.previewGateway.sendProcessingStarted(jobId);

      return jobId;
    } catch (error) {
      this.logger.error(
        `Error in sendToExternalBackend for socket ${socketId}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  getSocketForJob(jobId: string): string | undefined {
    return this.jobToSocket.get(jobId);
  }
}