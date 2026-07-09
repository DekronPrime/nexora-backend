import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectMembersService } from './project-members.service';
import { InviteMemberDto } from './dto/member.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: ProjectMembersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all members of a project' })
  @ApiResponse({ status: 200, description: 'Returns all project members' })
  @ApiResponse({ status: 403, description: 'Forbidden - not a project member' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findByProject(
    @Query('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.membersService.findByProject(projectId, userId);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a member to a project' })
  @ApiResponse({ status: 201, description: 'Member successfully invited' })
  @ApiResponse({ status: 403, description: 'Forbidden - only owners can invite' })
  @ApiResponse({ status: 404, description: 'Project or user not found' })
  @ApiResponse({ status: 409, description: 'User is already a member' })
  async invite(
    @Body() inviteDto: InviteMemberDto & { projectId: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.membersService.invite(inviteDto.projectId, inviteDto, userId);
  }

  @Delete(':memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from a project' })
  @ApiResponse({ status: 204, description: 'Member successfully removed' })
  @ApiResponse({ status: 403, description: 'Forbidden - only owners can remove members' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async remove(
    @Param('memberId') memberId: string,
    @Query('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.membersService.remove(projectId, memberId, userId);
  }

  @Post('leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave a project' })
  @ApiResponse({ status: 204, description: 'Successfully left the project' })
  @ApiResponse({ status: 403, description: 'Cannot leave as owner' })
  @ApiResponse({ status: 404, description: 'Not a member of this project' })
  async leave(
    @Query('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.membersService.leave(projectId, userId);
  }
}
