import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(forwardRef(() => PreviewService))
    private readonly previewService: PreviewService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extraer token de diferentes fuentes posibles
      const token = 
        client.handshake.auth.token || 
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: No token provided`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Verificar el token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET', 'your-secret-key'),
      });

      const userId = payload.sub;
      client.data.userId = userId;

      // Registrar el socket del usuario
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      this.logger.log(
        `Client ${client.id} connected for user ${userId} (Total sockets: ${this.userSockets.get(userId)!.size})`
      );
      
      client.emit('connected', { 
        message: 'Successfully connected to preview service',
        userId,
        socketId: client.id,
      });
    } catch (error) {
      this.logger.error(
        `Authentication failed for client ${client.id}:`,
        error.message
      );
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
      this.logger.log(`Client ${client.id} disconnected from user ${userId}`);
    } else {
      this.logger.log(`Client ${client.id} disconnected`);
    }
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
  async handleProcessImages(@ConnectedSocket() client: Socket, data: { files: string[] }) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { message: 'User not authenticated' });
      return;
    }

    if (!data.files || data.files.length !== 2) {
      client.emit('error', { message: 'Exactly 2 images are required' });
      return;
    }

    try {
      // Convert base64 to buffers
      const files: Array<Express.Multer.File> = data.files.map((base64, index) => {
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

      const jobId = await this.previewService.processImages(files, userId);

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
  sendProcessingStarted(userId: string, jobId: string) {
    const event: ProcessingStartedEvent = {
      jobId,
      message: 'Image processing has started',
      timestamp: new Date().toISOString(),
    };
    this.emitToUser(userId, 'processing:started', event);
  }

  sendProcessedImage(userId: string, jobId: string, data: any) {
    const event: ProcessingCompletedEvent = {
      jobId,
      data,
      timestamp: new Date().toISOString(),
    };
    this.emitToUser(userId, 'processing:completed', event);
  }

  sendError(userId: string, jobId: string, error: string) {
    const event: ProcessingErrorEvent = {
      jobId,
      error,
      timestamp: new Date().toISOString(),
    };
    this.emitToUser(userId, 'processing:error', event);
  }

  sendProgress(userId: string, jobId: string, progress: number, message?: string) {
    const event = {
      jobId,
      progress,
      message,
      timestamp: new Date().toISOString(),
    };
    this.emitToUser(userId, 'processing:progress', event);
  }

  private emitToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets && sockets.size > 0) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
      this.logger.log(
        `Emitted '${event}' to user ${userId} (${sockets.size} socket${sockets.size > 1 ? 's' : ''})`
      );
    } else {
      this.logger.warn(
        `No active sockets found for user ${userId} when emitting '${event}'`
      );
    }
  }

  // Método para obtener estadísticas de conexiones
  getConnectionStats() {
    return {
      totalUsers: this.userSockets.size,
      totalSockets: Array.from(this.userSockets.values()).reduce(
        (sum, sockets) => sum + sockets.size,
        0,
      ),
    };
  }
}