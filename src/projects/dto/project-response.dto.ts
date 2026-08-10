import { Exclude, Expose, Type } from 'class-transformer';

export class ProjectMemberUserDto {
    @Expose()
    id: string;

    @Expose()
    fullName: string;

    @Exclude()
    email: string;

    @Expose()
    avatarUrl: string | null;

    @Exclude()
    isVerified?: boolean;

    @Exclude()
    passwordHash?: string;

    @Exclude()
    createdAt: Date;

    @Exclude()
    updatedAt: Date;
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
    fullName: string;

    @Exclude()
    email: string;

    avatarUrl: string | null;

    @Exclude()
    isVerified?: boolean;

    @Exclude()
    passwordHash?: string;

    @Exclude()
    createdAt: Date;

    @Exclude()
    updatedAt: Date;
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
    completedTaskCount: number;
    createdAt: Date;
    updatedAt: Date;

    @Type(() => ProjectOwnerDto)
    owner: ProjectOwnerDto;

    @Type(() => ProjectMemberDto)
    members: ProjectMemberDto[];
}
