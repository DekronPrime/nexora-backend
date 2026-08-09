import { Exclude, Expose, Type } from 'class-transformer';

export class ProjectMemberUserDto {
    @Expose()
    id: string;

    @Expose()
    fullName: string;

    @Expose()
    avatarUrl: string | null;

    @Exclude()
    isVerified?: boolean;

    @Exclude()
    passwordHash?: string;
}

export class ProjectMemberDto {
    id: string;

    @Exclude()
    projectId: string;
    role: string;
    joinedAt: Date;

    @Type(() => ProjectMemberUserDto)
    user: ProjectMemberUserDto;

    @Exclude()
    userId?: string;
}

export class ProjectOwnerDto {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;

    @Exclude()
    isVerified?: boolean;

    @Exclude()
    passwordHash?: string;
}

export class ProjectResponseDto {
    id: string;
    title: string;
    description: string | null;
    color: string;
    icon: string;

    @Exclude()
    ownerId: string;
    taskCount: number;
    createdAt: Date;
    updatedAt: Date;

    @Type(() => ProjectOwnerDto)
    owner: ProjectOwnerDto;

    @Type(() => ProjectMemberDto)
    members: ProjectMemberDto[];
}
