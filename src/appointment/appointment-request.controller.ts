import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppointmentRequestService } from './services/appointment-request.service';
import { CreateAppointmentRequestDto } from './dto/create-appointment-request.dto';
import { AppointmentRequestResponseDto } from './dto/appointment-request-response.dto';

@ApiTags('appointment-requests')
@Controller('appointment-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppointmentRequestController {
  constructor(
    private readonly appointmentRequestService: AppointmentRequestService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create appointment request',
    description: 'Creates a new appointment request that will be sent to all available tenants. The first tenant to accept it gets the appointment.',
  })
  @ApiCreatedResponse({
    description: 'Appointment request created successfully',
    type: AppointmentRequestResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or user is not a client',
  })
  createAppointmentRequest(
    @Body() createAppointmentRequestDto: CreateAppointmentRequestDto,
    // TODO: Obtener clientId del token JWT
    // @CurrentUser() user: any,
  ): Promise<AppointmentRequestResponseDto> {
    const clientId = 'client-id-from-token'; // Temporal
    return this.appointmentRequestService.create(createAppointmentRequestDto, clientId)
      .then(request => this.mapToResponseDto(request));
  }

  @Get()
  @ApiOperation({
    summary: 'Get appointment requests',
    description: 'Retrieves paginated list of appointment requests. Clients see their own requests, tenants see available requests.',
  })
  @ApiOkResponse({
    description: 'Appointment requests retrieved successfully',
    type: [AppointmentRequestResponseDto],
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    // TODO: Obtener user info del token JWT
    // @CurrentUser() user: any,
  ) {
    const userId = 'user-id-from-token'; // Temporal
    const userType = 'CLIENTE'; // Temporal

    const offset = page ? (page - 1) * (limit || 10) : 0;

    if (userType === 'CLIENTE') {
      const result = await this.appointmentRequestService.findAll(
        userId, // clientId
        undefined, // tenantId
        limit || 10,
        offset,
      );
      return {
        ...result,
        data: result.data.map(request => this.mapToResponseDto(request)),
      };
    } else {
      // Para tenants, mostrar solicitudes disponibles
      const requests = await this.appointmentRequestService.findAvailableForTenant('tenant-id-from-user'); // Temporal
      return {
        data: requests.map(request => this.mapToResponseDto(request)),
        total: requests.length,
        page: 1,
        limit: requests.length,
        totalPages: 1,
      };
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get appointment request by ID',
    description: 'Retrieves details of a specific appointment request.',
  })
  @ApiParam({
    name: 'id',
    description: 'Appointment request ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Appointment request found',
    type: AppointmentRequestResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Appointment request not found',
  })
  async findOne(@Param('id') id: string): Promise<AppointmentRequestResponseDto> {
    const request = await this.appointmentRequestService.findById(id);
    return this.mapToResponseDto(request);
  }

  @Patch(':id/accept')
  @ApiOperation({
    summary: 'Accept appointment request',
    description: 'Accepts an appointment request. Only tenants can accept requests.',
  })
  @ApiParam({
    name: 'id',
    description: 'Appointment request ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Appointment request accepted successfully',
    type: AppointmentRequestResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request cannot be accepted or already accepted by another tenant',
  })
  async acceptRequest(
    @Param('id') id: string,
    // TODO: Obtener actorId del token JWT
    // @CurrentUser() user: any,
  ): Promise<AppointmentRequestResponseDto> {
    const actorId = 'actor-id-from-token'; // Temporal
    const tenantId = 'tenant-id-from-user'; // Temporal

    const request = await this.appointmentRequestService.acceptRequest(id, tenantId, actorId);
    return this.mapToResponseDto(request);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel appointment request',
    description: 'Cancels an appointment request. Only the client who created it can cancel it.',
  })
  @ApiParam({
    name: 'id',
    description: 'Appointment request ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Appointment request cancelled successfully',
    type: AppointmentRequestResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request cannot be cancelled',
  })
  async cancelRequest(
    @Param('id') id: string,
    // TODO: Obtener clientId del token JWT
    // @CurrentUser() user: any,
  ): Promise<AppointmentRequestResponseDto> {
    const clientId = 'client-id-from-token'; // Temporal

    const request = await this.appointmentRequestService.cancelRequest(id, clientId);
    return this.mapToResponseDto(request);
  }

  @Post(':id/convert-to-appointment')
  @ApiOperation({
    summary: 'Convert request to appointment',
    description: 'Converts an accepted appointment request to a real appointment by scheduling it in the calendar.',
  })
  @ApiParam({
    name: 'id',
    description: 'Appointment request ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiCreatedResponse({
    description: 'Appointment created successfully from request',
  })
  @ApiBadRequestResponse({
    description: 'Request is not accepted or invalid appointment data',
  })
  async convertToAppointment(
    @Param('id') id: string,
    @Body() appointmentData: {
      startTime: string;
      endTime: string;
      calendarId: string;
      totalPrice?: number;
      notes?: string;
    },
    // TODO: Obtener actorId del token JWT
    // @CurrentUser() user: any,
  ) {
    const actorId = 'actor-id-from-token'; // Temporal

    const result = await this.appointmentRequestService.convertToAppointment(
      id,
      appointmentData,
      actorId,
    );

    return {
      request: this.mapToResponseDto(result.request),
      appointment: result.appointment,
    };
  }

  private mapToResponseDto(request: any): AppointmentRequestResponseDto {
    return {
      id: request.id,
      title: request.title,
      description: request.description,
      budget: request.budget,
      designImages: request.designImages,
      preferences: request.preferences,
      status: request.status,
      expiresAt: request.expiresAt,
      client: request.client ? {
        id: request.client.id,
        name: request.client.name,
        email: request.client.email,
      } : undefined,
      acceptedByTenant: request.acceptedByTenant ? {
        id: request.acceptedByTenant.id,
        name: request.acceptedByTenant.name,
      } : undefined,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }
}