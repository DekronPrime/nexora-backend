import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember, Project } from '../projects/entities/project.entity';
import { User } from '../auth/entities/user.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationService } from '../notifications/notification.service';
import { InviteMemberDto } from './dto/member.dto';

@Injectable()
export class ProjectMembersService {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly activityLogService: ActivityLogService,
    private readonly notificationService: NotificationService,
  ) {}

  async findByProjectAndUser(
    projectId: string,
    userId: string,
  ): Promise<ProjectMember | null> {
    return this.memberRepository.findOne({
      where: { projectId, userId },
      relations: { user: true },
    });
  }

  async findByProject(projectId: string, userId: string): Promise<ProjectMember[]> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const membership = await this.findByProjectAndUser(projectId, userId);
    if (!membership && project.ownerId !== userId) {
      throw new ForbiddenException('You are not a member of this project');
    }

    return this.memberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.user', 'user')
      .where('member.projectId = :projectId', { projectId })
      .orderBy('member.joinedAt', 'DESC')
      .getMany();
  }

  async invite(
    projectId: string,
    inviteDto: InviteMemberDto,
    userId: string,
  ): Promise<ProjectMember> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only project owners can invite members');
    }

    const userToInvite = await this.userRepository.findOne({
      where: { email: inviteDto.email },
    });

    if (!userToInvite) {
      throw new NotFoundException('User with this email not found');
    }

    const existingMembership = await this.memberRepository.findOne({
      where: { projectId, userId: userToInvite.id },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of this project');
    }

    const member = this.memberRepository.create({
      projectId,
      userId: userToInvite.id,
      role: inviteDto.role || 'member',
    });

    const savedMember = await this.memberRepository.save(member);

    await this.activityLogService.log({
      userId,
      projectId,
      action: 'member_invited',
      entityType: 'member',
      entityId: userToInvite.id,
      newValue: { email: userToInvite.email, role: savedMember.role },
    });

    await this.notificationService.create({
      userId: userToInvite.id,
      type: 'project_invitation',
      title: 'Project Invitation',
      message: `You have been added to the project "${project.title}"`,
      data: { projectId, projectName: project.title },
    });

    return this.memberRepository.findOne({
      where: { id: savedMember.id },
      relations: { user: true },
    });
  }

  async remove(
    projectId: string,
    memberId: string,
    userId: string,
  ): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const member = await this.memberRepository.findOne({
      where: { id: memberId },
      relations: { user: true },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only project owners can remove members');
    }

    if (member.userId === project.ownerId) {
      throw new ForbiddenException('Cannot remove the project owner');
    }

    await this.activityLogService.log({
      userId,
      projectId,
      action: 'member_removed',
      entityType: 'member',
      entityId: member.userId,
      oldValue: { email: member.user?.email, role: member.role },
    });

    await this.memberRepository.remove(member);
  }

  async leave(projectId: string, userId: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId === userId) {
      throw new ForbiddenException('Project owner cannot leave the project. Transfer ownership first or delete the project.');
    }

    const member = await this.memberRepository.findOne({
      where: { projectId, userId },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this project');
    }

    await this.activityLogService.log({
      userId,
      projectId,
      action: 'member_left',
      entityType: 'member',
      entityId: userId,
    });

    await this.memberRepository.remove(member);
  }
}
