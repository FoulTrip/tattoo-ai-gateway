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
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { UsersService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { UserStatisticsDto } from './dto/user-statistics.dto';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}


  @Get()
  @ApiOperation({
    summary: 'Get paginated list of users',
    description: 'Retrieves a paginated list of users with optional filtering by search term and user type.',
  })
  @ApiOkResponse({
    description: 'Users retrieved successfully',
    type: PaginatedUsersDto,
  })
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get user statistics',
    description: 'Retrieves statistical information about users, including total count and distribution by user type.',
  })
  @ApiOkResponse({
    description: 'Statistics retrieved successfully',
    type: UserStatisticsDto,
  })
  getStatistics() {
    return this.usersService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a single user by their unique identifier.',
  })
  @ApiOkResponse({
    description: 'User found',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/details')
  @ApiOperation({
    summary: 'Get user details with relations',
    description: 'Retrieves a user with all related data (excluding sensitive information like password).',
  })
  @ApiOkResponse({
    description: 'User details retrieved successfully',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  findWithRelations(@Param('id') id: string) {
    return this.usersService.findWithRelations(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user information',
    description: 'Updates user information. Only name, phone, and avatar can be modified. Email, password, and userType are immutable.',
  })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    // TODO: Obtener actorId del token JWT
    const actorId = id; // Por ahora el mismo usuario
    return this.usersService.update(id, updateUserDto, actorId, ip, userAgent);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete user account',
    description: 'Permanently deletes a user account. This action cannot be undone.',
  })
  @ApiNoContentResponse({
    description: 'User deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  remove(
    @Param('id') id: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    // TODO: Obtener actorId del token JWT
    const actorId = id; // Por ahora el mismo usuario
    return this.usersService.remove(id, actorId, ip, userAgent);
  }
}