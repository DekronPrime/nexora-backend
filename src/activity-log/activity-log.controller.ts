import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogQueryDto } from './dto/activity-log.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activity')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get activity logs for a project' })
  @ApiResponse({ status: 200, description: 'Returns project activity logs' })
  async findByProject(
    @Param('projectId') projectId: string,
    @Query() query: ActivityLogQueryDto,
  ) {
    return this.activityLogService.findByProject(projectId, query);
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Get activity logs for a task' })
  @ApiResponse({ status: 200, description: 'Returns task activity logs' })
  async findByTask(@Param('taskId') taskId: string) {
    return this.activityLogService.findByTask(taskId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get activity logs for the current user' })
  @ApiResponse({ status: 200, description: 'Returns user activity logs' })
  async findByUser(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.activityLogService.findByUser(userId, limit);
  }
}
