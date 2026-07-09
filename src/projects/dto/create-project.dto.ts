import { IsString, IsOptional, MaxLength, IsHexColor, IsUUID } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(3000, { message: 'Description must not exceed 3000 characters' })
  description?: string;

  @IsString()
  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(3000, { message: 'Description must not exceed 3000 characters' })
  description?: string;

  @IsString()
  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;
}

export class ProjectQueryDto {
  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
