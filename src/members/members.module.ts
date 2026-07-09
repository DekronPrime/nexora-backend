import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersController } from './members.controller';
import { ProjectMembersService } from './project-members.service';
import { ProjectMember, Project } from '../projects/entities/project.entity';
import { User } from '../auth/entities/user.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectMember, Project, User]),
    ActivityLogModule,
    NotificationsModule,
    AuthModule
  ],
  controllers: [MembersController],
  providers: [ProjectMembersService],
  exports: [ProjectMembersService],
})
export class MembersModule { }
