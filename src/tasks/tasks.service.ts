import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from './dto/create-task.dto';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationService } from '../notifications/notification.service';
import { ProjectMember } from '../projects/entities/project.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly activityLogService: ActivityLogService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const membership = await this.projectMemberRepository.findOne({
      where: { projectId: createTaskDto.projectId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      createdBy: userId,
    });

    const savedTask = await this.taskRepository.save(task);

    await this.activityLogService.log({
      userId,
      projectId: createTaskDto.projectId,
      taskId: savedTask.id,
      action: 'task_created',
      entityType: 'task',
      entityId: savedTask.id,
      newValue: {
        title: savedTask.title,
        status: savedTask.status,
        priority: savedTask.priority,
      },
    });

    if (createTaskDto.assigneeId && createTaskDto.assigneeId !== userId) {
      await this.sendTaskAssignmentNotification(
        savedTask.id,
        savedTask.title,
        createTaskDto.projectId,
        createTaskDto.assigneeId,
        userId,
      );
    }

    return this.findOne(savedTask.id, userId);
  }

  private async sendTaskAssignmentNotification(
    taskId: string,
    taskTitle: string,
    projectId: string,
    assigneeId: string,
    assignerId: string,
  ) {
    const assigner = await this.userRepository.findOne({
      where: { id: assignerId },
    });

    await this.notificationService.create({
      userId: assigneeId,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `${assigner?.fullName || assigner?.email} assigned you to "${taskTitle}"`,
      data: { taskId, projectId, assignerId },
    });
  }

  async findAll(userId: string, query?: TaskQueryDto): Promise<Task[]> {
    let queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoin('project.members', 'member', 'member.userId = :userId', { userId })
      .where('project.ownerId = :userId OR member.id IS NOT NULL', { userId });

    if (query?.projectId) {
      queryBuilder = queryBuilder.andWhere('task.projectId = :projectId', {
        projectId: query.projectId,
      });
    }

    if (query?.status) {
      queryBuilder = queryBuilder.andWhere('task.status = :status', {
        status: query.status,
      });
    }

    if (query?.priority) {
      queryBuilder = queryBuilder.andWhere('task.priority = :priority', {
        priority: query.priority,
      });
    }

    if (query?.assigneeId) {
      queryBuilder = queryBuilder.andWhere('task.assigneeId = :assigneeId', {
        assigneeId: query.assigneeId,
      });
    }

    return queryBuilder
      .orderBy('task.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.creator', 'creator')
      .where('task.id = :id', { id })
      .getOne();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: { project: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const membership = await this.projectMemberRepository.findOne({
      where: { projectId: task.projectId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    const oldTask = { ...task };
    const oldAssigneeId = task.assigneeId;

    Object.assign(task, updateTaskDto);

    if (updateTaskDto.status === 'done' && oldTask.status !== 'done') {
      task.completedAt = new Date();
    } else if (updateTaskDto.status && updateTaskDto.status !== 'done') {
      task.completedAt = null;
    }

    const updatedTask = await this.taskRepository.save(task);

    await this.activityLogService.log({
      userId,
      projectId: task.projectId,
      taskId: updatedTask.id,
      action: 'task_updated',
      entityType: 'task',
      entityId: updatedTask.id,
      oldValue: {
        title: oldTask.title,
        status: oldTask.status,
        priority: oldTask.priority,
        assigneeId: oldTask.assigneeId,
      },
      newValue: {
        title: updatedTask.title,
        status: updatedTask.status,
        priority: updatedTask.priority,
        assigneeId: updatedTask.assigneeId,
      },
    });

    if (
      updateTaskDto.assigneeId &&
      updateTaskDto.assigneeId !== oldAssigneeId &&
      updateTaskDto.assigneeId !== userId
    ) {
      await this.sendTaskAssignmentNotification(
        updatedTask.id,
        updatedTask.title,
        task.projectId,
        updateTaskDto.assigneeId,
        userId,
      );
    }

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const membership = await this.projectMemberRepository.findOne({
      where: { projectId: task.projectId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    await this.activityLogService.log({
      userId,
      projectId: task.projectId,
      taskId: id,
      action: 'task_deleted',
      entityType: 'task',
      entityId: id,
      oldValue: { title: task.title },
    });

    await this.taskRepository.remove(task);
  }

  async findByProject(projectId: string, userId: string): Promise<Task[]> {
    const membership = await this.projectMemberRepository.findOne({
      where: { projectId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    return this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.creator', 'creator')
      .where('task.projectId = :projectId', { projectId })
      .orderBy('task.createdAt', 'DESC')
      .getMany();
  }
}
