import { ApiProperty } from '@nestjs/swagger';

export class ProcessResponseDto {
    @ApiProperty({
        description: 'Unique identifier for the processing job',
        example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    })
    jobId: string;

    @ApiProperty({
        description: 'Status message',
        example: 'Images are being processed. You will receive the result via WebSocket.',
    })
    message: string;

    @ApiProperty({
        description: 'Current status of the job',
        example: 'processing',
        enum: ['processing', 'queued'],
    })
    status: string;
}