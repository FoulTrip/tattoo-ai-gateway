import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  UseGuards,
  Request,
  Body,
  Logger,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiOkResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { PreviewService } from './preview.service';
import { ProcessResponseDto } from './dto/process-response.dto';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { PreviewGateway } from './preview.gateway';

declare module 'express' {
  interface Request {
    user: UserResponseDto;
  }
}

@ApiTags('preview')
@Controller('preview')
@ApiBearerAuth()
export class PreviewController {
  private readonly logger = new Logger(PreviewController.name);
  constructor(
    private readonly previewService: PreviewService,
    private readonly websocket: PreviewGateway,
  ) { }

  @Post('process')
  @ApiOperation({
    summary: 'Process two images',
    description: 'Upload two images to be processed by external backend. Result will be sent via WebSocket.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          minItems: 2,
          maxItems: 2,
        },
      },
      required: ['files'],
    },
  })
  @ApiOkResponse({
    description: 'Images uploaded successfully and processing started',
    type: ProcessResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input - exactly 2 images are required',
  })
  @UseInterceptors(FilesInterceptor('files', 2, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB por archivo
    },
  }))
  async processImages(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: { styles: string[], colors: string[], description: string },
    @Request() req: ExpressRequest,
  ): Promise<ProcessResponseDto> {
    if (!files || files.length !== 2) {
      throw new BadRequestException('Exactly 2 images are required');
    }

    // Validar que sean imágenes
    const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    for (const file of files) {
      if (!validImageTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WEBP images are allowed.`
        );
      }
    }

    // Validar tamaño mínimo (ej: 1KB)
    for (const file of files) {
      if (file.size < 1024) {
        throw new BadRequestException('Image files are too small');
      }
    }

    const socketId = 'placeholder'; // TODO: Get actual socketId from request
    const styles = body.styles;
    const colors = body.colors;
    const description = body.description;
    const jobId = await this.previewService.processImages(files, socketId, styles, colors, description);

    // Emitir evento sobre comienzo de procesamiento
    this.logger.log(`Calling sendProcessingStarted with jobId: ${jobId}`);
    this.websocket.sendProcessingStarted(jobId);

    return {
      jobId,
      message: 'Images are being processed',
      status: 'processing',
    };
  }

  @Post('webhook')
  async handleWebhook(@Body() body: { jobId: string; socketId: string; data: any }) {
    this.logger.log(`=== WEBHOOK RECEIVED ===`);
    this.logger.log(`JobId: ${body.jobId}`);
    this.logger.log(`SocketId: ${body.socketId}`);
    this.logger.log(`Data: ${JSON.stringify(body.data)}`);

    // Send directly to the specific socket
    this.logger.log(`Sending directly to socketId: ${body.socketId}`);
    this.websocket.sendProcessedImageToSocket(body.socketId, body.jobId, body.data);
  }
}