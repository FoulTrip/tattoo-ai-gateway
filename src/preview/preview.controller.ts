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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
@UseGuards(JwtAuthGuard)
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

    const userId = req.user.id;
    const jobId = await this.previewService.processImages(files, userId);

    // Emitir evento sobre comienzo de procesamiento
    this.websocket.sendProcessingStarted(userId, jobId);

    return {
      jobId,
      message: 'Images are being processed',
      status: 'processing',
    };
  }

  @Post('webhook')
  @UseGuards()
  async handleWebhook(@Body() body: { jobId: string; data: any }) {
    const userId = this.previewService.getUserForJob(body.jobId);
    if (userId) {
      this.websocket.sendProcessedImage(userId, body.jobId, body.data);
      this.logger.log(`Sent processed image for job ${body.jobId} to user ${userId}`);
    } else {
      this.logger.warn(`No user found for job ${body.jobId}`);
    }
  }
}