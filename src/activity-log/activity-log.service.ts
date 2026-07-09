import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { CreateActivityLogDto, ActivityLogQueryDto } from './dto/activity-log.dto';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  async log(logData: CreateActivityLogDto & { userId: string }): Promise<ActivityLog> {
    const activityLog = this.activityLogRepository.create({
      userId: logData.userId,
      projectId: logData.projectId || null,
      taskId: logData.taskId || null,
      action: logData.action,
      entityType: logData.entityType || null,
      entityId: logData.entityId || null,
      oldValue: logData.oldValue || null,
      newValue: logData.newValue || null,
      metadata: logData.metadata || null,
    });

    return this.activityLogRepository.save(activityLog);
  }

  async findByProject(
    projectId: string,
    query?: ActivityLogQueryDto,
  ): Promise<ActivityLog[]> {
    let queryBuilder = this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .leftJoinAndSelect('log.project', 'project')
      .leftJoinAndSelect('log.task', 'task')
      .where('log.projectId = :projectId', { projectId });

    if (query?.taskId) {
      queryBuilder = queryBuilder.andWhere('log.taskId = :taskId', {
        taskId: query.taskId,
      });
    }

    if (query?.userId) {
      queryBuilder = queryBuilder.andWhere('log.userId = :userId', {
        userId: query.userId,
      });
    }

    return queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .limit(100)
      .getMany();
  }

  async findByTask(taskId: string): Promise<ActivityLog[]> {
    return this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .where('log.taskId = :taskId', { taskId })
      .orderBy('log.createdAt', 'DESC')
      .getMany();
  }

  async findByUser(userId: string, limit = 50): Promise<ActivityLog[]> {
    return this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .leftJoinAndSelect('log.project', 'project')
      .where('log.userId = :userId', { userId })
      .orderBy('log.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }
}
