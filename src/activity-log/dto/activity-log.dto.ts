import { IsUUID, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateActivityLogDto {
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsUUID()
  @IsOptional()
  taskId?: string;

  @IsString()
  action: string;

  @IsString()
  @IsOptional()
  entityType?: string;

  @IsUUID()
  @IsOptional()
  entityId?: string;

  @IsObject()
  @IsOptional()
  oldValue?: Record<string, any>;

  @IsObject()
  @IsOptional()
  newValue?: Record<string, any>;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ActivityLogQueryDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  @IsOptional()
  taskId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;
}
