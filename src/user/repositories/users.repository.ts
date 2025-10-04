import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserType, Prisma } from '@prisma/client';

@Injectable()
export class UsersRepository {
    private readonly logger = new Logger(UsersRepository.name);

    constructor(private readonly prisma: PrismaService) { }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        try {
            return await this.prisma.user.create({ data });
        } catch (error) {
            this.logger.error(`Error creating user: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.UserWhereInput;
        orderBy?: Prisma.UserOrderByWithRelationInput;
    }): Promise<User[]> {
        const { skip, take, where, orderBy } = params;
        try {
            return await this.prisma.user.findMany({
                skip,
                take,
                where,
                orderBy,
            });
        } catch (error) {
            this.logger.error(`Error finding users: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
        try {
            return await this.prisma.user.findUnique({ where });
        } catch (error) {
            this.logger.error(`Error finding user: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.findOne({ email });
    }

    async findById(id: string): Promise<User | null> {
        return this.findOne({ id });
    }

    async update(params: {
        where: Prisma.UserWhereUniqueInput;
        data: Prisma.UserUpdateInput;
    }): Promise<User> {
        const { where, data } = params;
        try {
            return await this.prisma.user.update({
                where,
                data,
            });
        } catch (error) {
            this.logger.error(`Error updating user: ${error.message}`, error.stack);
            throw error;
        }
    }

    async delete(where: Prisma.UserWhereUniqueInput): Promise<User> {
        try {
            return await this.prisma.user.delete({ where });
        } catch (error) {
            this.logger.error(`Error deleting user: ${error.message}`, error.stack);
            throw error;
        }
    }

    async count(where?: Prisma.UserWhereInput): Promise<number> {
        try {
            return await this.prisma.user.count({ where });
        } catch (error) {
            this.logger.error(`Error counting users: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findWithRelations(id: string) {
        try {
            return await this.prisma.user.findUnique({
                where: { id },
                include: {
                    ownedTenant: {
                        include: {
                            collections: {
                                take: 5,
                                orderBy: { createdAt: 'desc' },
                            },
                            appointments: {
                                take: 10,
                                orderBy: { startTime: 'desc' },
                            },
                        },
                    },
                    tenantMemberships: {
                        include: {
                            tenant: {
                                select: {
                                    id: true,
                                    name: true,
                                    logo: true,
                                },
                            },
                        },
                    },
                    appointments: {
                        take: 10,
                        orderBy: { startTime: 'desc' },
                        include: {
                            tenant: {
                                select: {
                                    id: true,
                                    name: true,
                                    logo: true,
                                },
                            },
                        },
                    },
                },
            });
        } catch (error) {
            this.logger.error(`Error finding user with relations: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findByUserType(userType: UserType, limit?: number): Promise<User[]> {
        try {
            return await this.prisma.user.findMany({
                where: { userType },
                take: limit,
                orderBy: { createdAt: 'desc' },
            });
        } catch (error) {
            this.logger.error(`Error finding users by type: ${error.message}`, error.stack);
            throw error;
        }
    }
}