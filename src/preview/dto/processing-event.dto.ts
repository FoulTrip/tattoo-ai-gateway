import { ApiProperty } from '@nestjs/swagger';

export class ProcessingStartedEvent {
  @ApiProperty()
  jobId: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  timestamp: string;
}

export class ProcessingCompletedEvent {
  @ApiProperty()
  jobId: string;

  @ApiProperty()
  data: any;

  @ApiProperty()
  timestamp: string;
}

export class ProcessingErrorEvent {
  @ApiProperty()
  jobId: string;

  @ApiProperty()
  error: string;

  @ApiProperty()
  timestamp: string;
}

export class ProcessingProgressEvent {
  @ApiProperty()
  jobId: string;

  @ApiProperty()
  progress: number;

  @ApiProperty({ required: false })
  message?: string;

  @ApiProperty()
  timestamp: string;
}