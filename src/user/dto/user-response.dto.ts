import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '@prisma/client';

export class UserResponseDto {
    @ApiProperty({
        description: 'Unique user identifier',
        example: '507f1f77bcf86cd799439011',
    })
    id: string;

    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
        format: 'email',
    })
    email: string;

    @ApiProperty({
        description: 'User full name',
        example: 'John Doe',
    })
    name: string;

    @ApiPropertyOptional({
        description: 'User phone number',
        example: '+1234567890',
    })
    phone?: string;

    @ApiPropertyOptional({
        description: 'User avatar URL',
        example: 'https://example.com/avatar.jpg',
    })
    avatar?: string;

    @ApiProperty({
        description: 'User type',
        enum: UserType,
        example: UserType.CLIENTE,
    })
    userType: UserType;

    @ApiProperty({
        description: 'Account creation timestamp',
        example: '2023-01-01T00:00:00.000Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Last update timestamp',
        example: '2023-01-01T00:00:00.000Z',
    })
    updatedAt: Date;

    @Exclude()
    password: string;

    constructor(partial: Partial<UserResponseDto>) {
        Object.assign(this, partial);
    }
}