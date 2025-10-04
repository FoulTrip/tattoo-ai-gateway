import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '@prisma/client';

export class QueryUserDto {
    @ApiPropertyOptional({
        description: 'Search term to filter users by name or email',
        example: 'john',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Filter users by type',
        enum: UserType,
        example: UserType.CLIENTE,
    })
    @IsOptional()
    @IsEnum(UserType)
    userType?: UserType;

    @ApiPropertyOptional({
        description: 'Page number for pagination (starts from 1)',
        example: 1,
        minimum: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of items per page',
        example: 10,
        minimum: 1,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}