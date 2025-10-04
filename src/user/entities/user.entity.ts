import { UserType } from '@prisma/client';

export class UserEntity {
    id: string;
    email: string;
    name: string;
    phone?: string;
    avatar?: string;
    userType: UserType;
    createdAt: Date;
    updatedAt: Date;

    constructor(partial: Partial<UserEntity>) {
        Object.assign(this, partial);
    }

    // Método para ocultar información sensible
    toJSON() {
        const { ...user } = this;
        return user;
    }
}