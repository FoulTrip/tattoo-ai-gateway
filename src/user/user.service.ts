import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';
import { HelpersAuditService } from '../audit/services/helpers.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly auditHelper: HelpersAuditService,
    private readonly auditService: AuditService,
  ) { }

  async create(createUserDto: CreateUserDto, ipAddress?: string, userAgent?: string): Promise<UserResponseDto> {
    this.logger.log(`Creating user with email: ${createUserDto.email}`);

    // Verificar si el email ya existe
    const existingUser = await this.usersRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // Registrar en auditoría
    await this.auditHelper.logUserCreated(
      user.id,
      user.email,
      user.name,
      {
        ipAddress,
        userAgent,
        actorId: user.id,
        actorEmail: user.email,
        actorName: user.name,
      }
    );

    this.logger.log(`User created successfully: ${user.id}`);
    return new UserResponseDto({
      ...user,
      phone: user.phone ?? undefined,
      avatar: user.avatar ?? undefined,
    });
  }

  async findAll(query: QueryUserDto): Promise<{
    data: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log('Finding all users');

    const { search, userType, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (userType) {
      where.userType = userType;
    }

    const [users, total] = await Promise.all([
      this.usersRepository.findAll({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.usersRepository.count(where),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: users.map(user => new UserResponseDto({
        ...user,
        phone: user.phone ?? undefined,
        avatar: user.avatar ?? undefined,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    this.logger.log(`Finding user with id: ${id}`);

    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new UserResponseDto({
      ...user,
      phone: user.phone ?? undefined,
      avatar: user.avatar ?? undefined,
    });
  }

  async findOneByEmail(email: string): Promise<UserResponseDto> {
    this.logger.log(`Finding user with email: ${email}`);

    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new UserResponseDto({
      ...user,
      phone: user.phone ?? undefined,
      avatar: user.avatar ?? undefined,
    });
  }

  async findWithRelations(id: string) {
    this.logger.log(`Finding user with relations: ${id}`);

    const user = await this.usersRepository.findWithRelations(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Excluir password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating user with id: ${id}`);

    const existingUser = await this.usersRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Guardar valores antiguos para auditoría
    const oldValues = {
      name: existingUser.name,
      phone: existingUser.phone,
      avatar: existingUser.avatar,
    };

    const updatedUser = await this.usersRepository.update({
      where: { id },
      data: updateUserDto,
    });

    // Registrar cambios en auditoría
    await this.auditHelper.logUserUpdated(
      id,
      oldValues,
      {
        name: updatedUser.name,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
      },
      {
        actorId: actorId || id,
        ipAddress,
        userAgent,
      }
    );

    this.logger.log(`User updated successfully: ${id}`);
    return new UserResponseDto({
      ...updatedUser,
      phone: updatedUser.phone ?? undefined,
      avatar: updatedUser.avatar ?? undefined,
    });
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ message: string }> {
    this.logger.log(`Changing password for user: ${id}`);

    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      // Auditar intento fallido
      await this.auditService.log({
        action: 'USER_PASSWORD_CHANGED',
        severity: 'WARNING',
        description: 'Intento de cambio de contraseña fallido: contraseña actual incorrecta',
        resourceId: id,
        resourceType: 'USER',
        actorId: id,
        ipAddress,
        userAgent,
        success: false,
        metadata: {
          reason: 'invalid_current_password'
        },
      });

      throw new BadRequestException('Current password is incorrect');
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.usersRepository.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Auditar cambio exitoso de contraseña
    await this.auditService.log({
      action: 'USER_PASSWORD_CHANGED',
      severity: 'INFO',
      description: 'Contraseña cambiada exitosamente',
      resourceId: id,
      resourceType: 'USER',
      actorId: id,
      ipAddress,
      userAgent,
      success: true,
    });

    this.logger.log(`Password changed successfully for user: ${id}`);
    return { message: 'Password changed successfully' };
  }

  async remove(
    id: string,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    this.logger.log(`Removing user with id: ${id}`);

    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.delete({ id });

    // Registrar eliminación en auditoría
    await this.auditHelper.logUserDeleted(
      id,
      user.name,
      {
        actorId: actorId || id,
        actorEmail: user.email,
        ipAddress,
        userAgent,
      }
    );

    this.logger.log(`User deleted successfully: ${id}`);
  }

  async verifyEmail(
    id: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ message: string }> {
    this.logger.log(`Verifying email for user: ${id}`);

    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Auditar verificación de email
    await this.auditService.log({
      action: 'USER_EMAIL_VERIFIED',
      severity: 'INFO',
      description: `Email verificado: ${user.email}`,
      resourceId: id,
      resourceType: 'USER',
      actorId: id,
      actorEmail: user.email,
      ipAddress,
      userAgent,
      success: true,
    });

    this.logger.log(`Email verified for user: ${id}`);
    return { message: 'Email verified successfully' };
  }

  async getStatistics() {
    this.logger.log('Getting user statistics');

    const [total, tatuadores, clientes] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ userType: 'TATUADOR' }),
      this.usersRepository.count({ userType: 'CLIENTE' }),
    ]);

    return {
      total,
      byType: {
        tatuadores,
        clientes,
      },
      percentages: {
        tatuadores: total > 0 ? (tatuadores / total) * 100 : 0,
        clientes: total > 0 ? (clientes / total) * 100 : 0,
      },
    };
  }
}