import { IsEmail, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(['owner', 'member'])
  @IsOptional()
  role?: 'owner' | 'member';
}

export class MemberQueryDto {
  @IsUUID()
  projectId: string;
}
