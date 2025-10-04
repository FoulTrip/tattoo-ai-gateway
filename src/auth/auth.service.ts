import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../user/repositories/users.repository';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto, TokenResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { UserType } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  async register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const userData = {
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      phone: registerDto.phone || null,
      avatar: registerDto.avatar || null,
      userType: registerDto.userType,
    };

    const dbUser = await this.usersRepository.create(userData);

    // Convert to UserResponseDto
    const user = new UserResponseDto({
      ...dbUser,
      phone: dbUser.phone ?? undefined,
      avatar: dbUser.avatar ?? undefined,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Log successful registration
    await this.auditService.log({
      action: 'USER_CREATED',
      severity: 'INFO',
      description: `Usuario registrado: ${user.email}`,
      resourceId: user.id,
      resourceType: 'USER',
      actorId: user.id,
      ipAddress,
      userAgent,
      success: true,
    });

    return {
      ...tokens,
      user,
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    // Find user by email
    const dbUser = await this.usersRepository.findByEmail(loginDto.email);
    if (!dbUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, dbUser.password);
    if (!isPasswordValid) {
      // Log failed login attempt
      await this.auditService.log({
        action: 'SECURITY_SUSPICIOUS_LOGIN',
        severity: 'WARNING',
        description: `Intento de login fallido: ${loginDto.email}`,
        actorEmail: loginDto.email,
        resourceType: 'USER',
        ipAddress,
        userAgent,
        success: false,
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // Convert to UserResponseDto
    const user = new UserResponseDto({
      ...dbUser,
      phone: dbUser.phone ?? undefined,
      avatar: dbUser.avatar ?? undefined,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Log successful login
    await this.auditService.log({
      action: 'USER_LOGIN',
      severity: 'INFO',
      description: `Login exitoso: ${user.email}`,
      resourceId: user.id,
      resourceType: 'USER',
      actorId: user.id,
      ipAddress,
      userAgent,
      success: true,
    });

    return {
      ...tokens,
      user,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'your-refresh-secret-key'),
      });

      const dbUser = await this.usersRepository.findById(payload.sub);
      if (!dbUser) {
        throw new UnauthorizedException('User not found');
      }

      const user = new UserResponseDto({
        ...dbUser,
        phone: dbUser.phone ?? undefined,
        avatar: dbUser.avatar ?? undefined,
      });

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, ipAddress?: string, userAgent?: string): Promise<{ message: string }> {
    // In a real application, you might want to blacklist the token
    // For now, we'll just log the logout event

    await this.auditService.log({
      action: 'USER_LOGOUT',
      severity: 'INFO',
      description: 'Usuario cerró sesión',
      resourceId: userId,
      resourceType: 'USER',
      actorId: userId,
      ipAddress,
      userAgent,
      success: true,
    });

    return { message: 'Logged out successfully' };
  }

  async changePassword(
    userId: string,
    changePasswordDto: { currentPassword: string; newPassword: string },
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      await this.auditService.log({
        action: 'USER_PASSWORD_CHANGED',
        severity: 'WARNING',
        description: 'Intento de cambio de contraseña fallido: contraseña actual incorrecta',
        resourceId: userId,
        resourceType: 'USER',
        actorId: userId,
        ipAddress,
        userAgent,
        success: false,
      });
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Update password
    await this.usersRepository.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Log successful password change
    await this.auditService.log({
      action: 'USER_PASSWORD_CHANGED',
      severity: 'INFO',
      description: 'Contraseña cambiada exitosamente',
      resourceId: userId,
      resourceType: 'USER',
      actorId: userId,
      ipAddress,
      userAgent,
      success: true,
    });

    return { message: 'Password changed successfully' };
  }

  async verifyEmail(userId: string, ipAddress?: string, userAgent?: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Log email verification
    await this.auditService.log({
      action: 'USER_EMAIL_VERIFIED',
      severity: 'INFO',
      description: `Email verificado: ${user.email}`,
      resourceId: userId,
      resourceType: 'USER',
      actorId: userId,
      ipAddress,
      userAgent,
      success: true,
    });

    return { message: 'Email verified successfully' };
  }

  private async generateTokens(user: any): Promise<TokenResponseDto> {
    const payload = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET', 'your-secret-key'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1h'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'your-refresh-secret-key'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
    };
  }
}