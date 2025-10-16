import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { PreviewService } from './preview.service';
import {
  ProcessingStartedEvent,
  ProcessingCompletedEvent,
  ProcessingErrorEvent,
} from './dto/processing-event.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // En producción, especifica tu dominio de frontend
    credentials: true,
  },
  namespace: '/preview',
})
export class PreviewGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PreviewGateway.name);

  constructor(
    @Inject(forwardRef(() => PreviewService))
    private readonly previewService: PreviewService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client ${client.id} connected`);

    client.emit('connected', {
      message: 'Successfully connected to preview service',
      socketId: client.id,
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return {
      event: 'pong',
      data: {
        timestamp: Date.now(),
        socketId: client.id,
      }
    };
  }

  @SubscribeMessage('process-images')
  async handleProcessImages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { files: string[]; styles?: string[]; colors?: string[]; description?: string },
  ) {
    const { files, styles, colors, description } = data;
    this.logger.log(`Received WebSocket files: ${files?.length} items from socket ${client.id}`);

    if (!files || !Array.isArray(files) || files.length !== 2) {
      this.logger.error(`Invalid files received: files is ${files}, length is ${files?.length}`);
      client.emit('error', { message: 'Exactly 2 images are required' });
      return;
    }

    try {
      // Convert base64 to buffers
      const processedFiles: Array<Express.Multer.File> = files.map((base64, index) => {
        const buffer = Buffer.from(base64, 'base64');
        const mimetype = this.getMimeType(buffer); // Simple detection
        if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(mimetype)) {
          throw new Error(`Invalid file type: ${mimetype}`);
        }
        if (buffer.length < 1024) {
          throw new Error('Image files are too small');
        }
        return {
          buffer,
          originalname: `image${index + 1}.png`, // Default
          mimetype,
          size: buffer.length,
          fieldname: 'files',
          encoding: '7bit',
          destination: '',
          filename: `image${index + 1}.png`,
          path: '',
          stream: null as any,
        };
      });

      // Pass socketId to the service
      const jobId = await this.previewService.processImages(processedFiles, client.id, styles, colors, description);

      // Emit back the jobId or something
      client.emit('processing-started', { jobId, message: 'Images are being processed' });
    } catch (error) {
      this.logger.error('Error processing images via WS:', error.message);
      client.emit('error', { message: error.message });
    }
  }

  private getMimeType(buffer: Buffer): string {
    // Simple MIME type detection based on magic numbers
    if (buffer.length < 4) return 'application/octet-stream';
    const header = buffer.slice(0, 4).toString('hex');
    if (header.startsWith('ffd8')) return 'image/jpeg';
    if (header.startsWith('89504e47')) return 'image/png';
    if (header.startsWith('52494646')) return 'image/webp'; // RIFF for WEBP
    return 'application/octet-stream';
  }

  // Métodos para enviar eventos al cliente
  sendProcessingStarted(jobId: string) {
    const event: ProcessingStartedEvent = {
      jobId,
      message: 'Image processing has started',
      timestamp: new Date().toISOString(),
    };
    this.logger.log(`Emitting 'processing:started' event to all clients: ${JSON.stringify(event)}`);
    this.server.emit('processing:started', event);
  }

  sendProcessedImage(jobId: string, data: any) {
    const event: ProcessingCompletedEvent = {
      jobId,
      data,
      timestamp: new Date().toISOString(),
    };
    this.server.emit('processing:completed', event);
  }

  sendProcessedImageToSocket(socketId: string, jobId: string, data: any) {
    this.logger.log(`Attempting to send to socket ${socketId}, server.sockets: ${this.server?.sockets}, sockets.sockets: ${this.server?.sockets?.sockets}`);

    const event: ProcessingCompletedEvent = {
      jobId,
      data,
      timestamp: new Date().toISOString(),
    };

    if (this.server && this.server.sockets && this.server.sockets.sockets) {
      const client = this.server.sockets.sockets.get(socketId);
      if (client) {
        this.logger.log(`Sending processing:completed event directly to socket ${socketId}`);
        client.emit('processing:completed', event);
        return;
      } else {
        this.logger.warn(`Socket ${socketId} not found in connected sockets`);
      }
    } else {
      this.logger.error(`Server sockets not available`);
    }

    // Fallback to broadcast
    this.logger.log(`Falling back to broadcast for job ${jobId}`);
    this.server.emit('processing:completed', event);
  }

  sendError(jobId: string, error: string) {
    const event: ProcessingErrorEvent = {
      jobId,
      error,
      timestamp: new Date().toISOString(),
    };
    this.server.emit('processing:error', event);
  }

  sendProgress(jobId: string, progress: number, message?: string) {
    const event = {
      jobId,
      progress,
      message,
      timestamp: new Date().toISOString(),
    };
    this.server.emit('processing:progress', event);
  }

  // Método para obtener estadísticas de conexiones
  getConnectionStats() {
    return {
      totalSockets: this.server.sockets.sockets.size,
    };
  }
}