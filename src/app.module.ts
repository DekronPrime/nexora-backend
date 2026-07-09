import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { MembersModule } from './members/members.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        ssl: configService.get<string>('DATABASE_URL')?.includes('supabase.com')
          ? { rejectUnauthorized: false }
          : false,
        entities: [
          __dirname + '/**/*.entity{.ts,.js}',
        ],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ProjectsModule,
    TasksModule,
    MembersModule,
    ActivityLogModule,
    NotificationsModule,
  ],
})
export class AppModule { }
