import { Exclude, Expose } from "class-transformer";

export class ResponseUserDto {
    @Expose()
    id: string;

    @Expose()
    email: string;

    @Expose()
    fullName: string | null;

    @Expose()
    avatarUrl: string | null;

    @Expose()
    isVerified: boolean;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    @Exclude()
    passwordHash: string;

    constructor(partial: Partial<ResponseUserDto>) {
        Object.assign(this, partial);
    }
}