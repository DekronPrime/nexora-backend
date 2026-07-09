import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ProjectMembersService } from '../../members/project-members.service';

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(private readonly projectMembersService: ProjectMembersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const projectId = request.params.projectId || request.body.projectId || request.query.projectId;
    const requiredRole = request.body?.requiredRole || 'member';

    if (!user || !projectId) {
      throw new ForbiddenException('Access denied');
    }

    const membership = await this.projectMembersService.findByProjectAndUser(
      projectId,
      user.id,
    );

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    if (requiredRole === 'owner' && membership.role !== 'owner') {
      throw new ForbiddenException('Only project owners can perform this action');
    }

    request.userMembership = membership;
    return true;
  }
}
