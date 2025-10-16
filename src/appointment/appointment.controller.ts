import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  Ip,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AppointmentService } from './services/appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import { AppointmentResponseDto } from './dto/appointment-response.dto';
import { PaginatedAppointmentsDto } from './dto/paginated-appointments.dto';

@ApiTags('appointments')
@Controller('appointments')
@UseInterceptors(ClassSerializerInterceptor)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new appointment',
    description:
      'Creates a new appointment in the calendar. Validates that the tenant, calendar, and client exist. Also checks for time conflicts with existing appointments. Emits WebSocket event on success.',
  })
  @ApiCreatedResponse({
    description: 'Appointment created successfully',
    type: AppointmentResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid input data, start time must be before end time, or client is not of type CLIENTE',
  })
  @ApiNotFoundResponse({
    description: 'Tenant, calendar, or client not found',
  })
  @ApiConflictResponse({
    description: 'Time conflict with another appointment in the same calendar',
  })
  create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    // TODO: Obtener actorId del token JWT
    const actorId = createAppointmentDto.clientId; // Por ahora usamos el clientId
    return this.appointmentService.create(
      createAppointmentDto,
      actorId,
      ip,
      userAgent,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get paginated list of appointments',
    description:
      'Retrieves a paginated list of appointments with optional filtering by tenant, calendar, client, status, date range, and search term.',
  })
  @ApiOkResponse({
    description: 'Appointments retrieved successfully',
    type: PaginatedAppointmentsDto,
  })
  findAll(@Query() query: QueryAppointmentDto) {
    return this.appointmentService.findAll(query);
  }

  @Get('calendar/:calendarId')
  @ApiOperation({
    summary: 'Get appointments by calendar',
    description:
      'Retrieves all appointments for a specific calendar with optional date range filtering.',
  })
  @ApiParam({
    name: 'calendarId',
    description: 'Calendar ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiOkResponse({
    description: 'Appointments retrieved successfully',
    type: [AppointmentResponseDto],
  })
  getAppointmentsByCalendar(
    @Param('calendarId') calendarId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentService.getAppointmentsByCalendar(
      calendarId,
      startDate,
      endDate,
    );
  }

  @Get('tenant/:tenantId/upcoming')
  @ApiOperation({
    summary: 'Get upcoming appointments for a tenant',
    description:
      'Retrieves the next upcoming appointments for a tenant (excluding cancelled and completed ones).',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Upcoming appointments retrieved successfully',
    type: [AppointmentResponseDto],
  })
  getUpcomingAppointments(
    @Param('tenantId') tenantId: string,
    @Query('limit') limit?: number,
  ) {
    return this.appointmentService.getUpcomingAppointments(
      tenantId,
      limit || 10,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get appointment by ID',
    description:
      'Retrieves a single appointment by its unique identifier, including related tenant, calendar, and client information.',
  })
  @ApiParam({
    name: 'id',
    description: 'Appointment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Appointment found',
    type: AppointmentResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Appointment not found',
  })
  findOne(@Param('id') id: string) {
    return this.appointmentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update appointment information',
    description:
      'Updates appointment information. Can change status, dates, prices, notes, and design images. Validates time conflicts if dates are changed. Automatically logs the appropriate audit action and emits WebSocket events (updated, confirmed, cancelled, completed, or rescheduled).',
  })
  @ApiParam({
    name: 'id',
    description: 'Appointment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Appointment updated successfully',
    type: AppointmentResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Appointment not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or start time must be before end time',
  })
  @ApiConflictResponse({
    description: 'Time conflict with another appointment in the same calendar',
  })
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    // TODO: Obtener actorId del token JWT
    const actorId = id; // Por ahora usamos el id del appointment
    return this.appointmentService.update(
      id,
      updateAppointmentDto,
      actorId,
      ip,
      userAgent,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete appointment',
    description:
      'Permanently deletes an appointment. This action cannot be undone. The deletion is logged in the audit system and emits a WebSocket event.',
  })
  @ApiParam({
    name: 'id',
    description: 'Appointment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiNoContentResponse({
    description: 'Appointment deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Appointment not found',
  })
  remove(
    @Param('id') id: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    // TODO: Obtener actorId del token JWT
    const actorId = id; // Por ahora usamos el id del appointment
    return this.appointmentService.remove(id, actorId, ip, userAgent);
  }
}
