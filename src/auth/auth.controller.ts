import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Ip,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto, TokenResponseDto } from './dto/auth-response.dto';
import { MessageResponseDto } from '../user/dto/message-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader({
    name: 'user-agent',
    description: 'User agent string',
    required: false,
  })
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account and returns authentication tokens.',
  })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  @ApiConflictResponse({
    description: 'Email already exists',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<AuthResponseDto> {
    return this.authService.register(registerDto, ip, userAgent);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates a user and returns access and refresh tokens.',
  })
  @ApiOkResponse({
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generates new access and refresh tokens using a valid refresh token.',
  })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully',
    type: TokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid refresh token',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User logout',
    description: 'Logs out the current user and invalidates the session.',
  })
  @ApiOkResponse({
    description: 'Logged out successfully',
    type: MessageResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async logout(
    @Request() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    return this.authService.logout(userId, ip, userAgent);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change user password',
    description: 'Changes the authenticated user password after verifying the current password.',
  })
  @ApiOkResponse({
    description: 'Password changed successfully',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Current password is incorrect or invalid new password',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: { currentPassword: string; newPassword: string },
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    return this.authService.changePassword(userId, changePasswordDto, ip, userAgent);
  }

  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify user email',
    description: 'Marks the authenticated user email as verified.',
  })
  @ApiOkResponse({
    description: 'Email verified successfully',
    type: MessageResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async verifyEmail(
    @Request() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    return this.authService.verifyEmail(userId, ip, userAgent);
  }
}