import {
  IsString,
  IsOptional,
  MaxLength,
  IsEnum,
  IsUUID,
} from 'class-validator';

export class CreateTaskDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(3000, { message: 'Description must not exceed 3000 characters' })
  description?: string;

  @IsEnum(['todo', 'in_progress', 'review', 'done'])
  @IsOptional()
  status?: 'todo' | 'in_progress' | 'review' | 'done';

  @IsEnum(['low', 'medium', 'high', 'urgent'])
  @IsOptional()
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @IsUUID()
  @IsOptional()
  assigneeId?: string;
}

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(3000, { message: 'Description must not exceed 3000 characters' })
  description?: string;

  @IsEnum(['todo', 'in_progress', 'review', 'done'])
  @IsOptional()
  status?: 'todo' | 'in_progress' | 'review' | 'done';

  @IsEnum(['low', 'medium', 'high', 'urgent'])
  @IsOptional()
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @IsUUID()
  @IsOptional()
  assigneeId?: string | null;
}

export class TaskQueryDto {
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsEnum(['todo', 'in_progress', 'review', 'done'])
  @IsOptional()
  status?: 'todo' | 'in_progress' | 'review' | 'done';

  @IsEnum(['low', 'medium', 'high', 'urgent'])
  @IsOptional()
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @IsUUID()
  @IsOptional()
  assigneeId?: string;
}
