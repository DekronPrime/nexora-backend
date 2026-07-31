import { IsEmail, IsOptional, IsString, IsUrl, MaxLength, Matches } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    fullName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    @Matches(/^[a-zA-Z0-9_]+$/, { message: 'nickname can only contain letters, numbers and underscores' })
    nickname?: string;

    @IsOptional()
    @IsUrl()
    avatarUrl?: string;
}