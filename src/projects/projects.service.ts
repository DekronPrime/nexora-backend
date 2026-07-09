import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Project, ProjectMember } from './entities/project.entity';
import { CreateProjectDto, UpdateProjectDto, ProjectQueryDto } from './dto/create-project.dto';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    userId: string,
  ): Promise<Project> {
    const project = this.projectRepository.create({
      ...createProjectDto,
      ownerId: userId,
    });

    const savedProject = await this.projectRepository.save(project);

    const member = this.projectMemberRepository.create({
      projectId: savedProject.id,
      userId: userId,
      role: 'owner',
    });

    await this.projectMemberRepository.save(member);

    await this.activityLogService.log({
      userId,
      projectId: savedProject.id,
      action: 'project_created',
      entityType: 'project',
      entityId: savedProject.id,
      newValue: { title: savedProject.title, description: savedProject.description },
    });

    return this.findOne(savedProject.id, userId);
  }

  async findAll(userId: string, query?: ProjectQueryDto): Promise<Project[]> {
    const projects = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .leftJoin(
        'project_members',
        'member',
        'member.project_id = project.id AND member.user_id = :userId',
        { userId },
      )
      .where('project.ownerId = :userId OR member.id IS NOT NULL', { userId })
      .andWhere(query?.ownerId ? 'project.ownerId = :ownerId' : '1=1', { ownerId: query?.ownerId })
      .orderBy('project.createdAt', 'DESC')
      .getMany();

    return projects;
  }

  async findOne(id: string, userId: string): Promise<Project> {
    const project = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .leftJoinAndSelect('project.members', 'members')
      .leftJoinAndSelect('members.user', 'memberUser')
      .where('project.id = :id', { id })
      .getOne();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
  ): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: { owner: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only project owners can update the project');
    }

    const oldProject = { ...project };

    Object.assign(project, updateProjectDto);

    const updatedProject = await this.projectRepository.save(project);

    await this.activityLogService.log({
      userId,
      projectId: id,
      action: 'project_updated',
      entityType: 'project',
      entityId: id,
      oldValue: { title: oldProject.title, description: oldProject.description },
      newValue: { title: updatedProject.title, description: updatedProject.description },
    });

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only project owners can delete the project');
    }

    await this.activityLogService.log({
      userId,
      projectId: id,
      action: 'project_deleted',
      entityType: 'project',
      entityId: id,
      oldValue: { title: project.title },
    });

    await this.projectRepository.remove(project);
  }
}
