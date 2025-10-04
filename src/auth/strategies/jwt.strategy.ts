import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../../user/repositories/users.repository';
import { UserResponseDto } from '../../user/dto/user-response.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersRepository: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'your-secret-key'),
    });
  }

  async validate(payload: JwtPayload): Promise<UserResponseDto> {
    const { sub: userId } = payload;

    const dbUser = await this.usersRepository.findById(userId);
    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }

    return new UserResponseDto({
      ...dbUser,
      phone: dbUser.phone ?? undefined,
      avatar: dbUser.avatar ?? undefined,
    });
  }
}