import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from '../auth/entities/user.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Patch('/password')
  changePassword(@CurrentUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(user.id, dto);
  }
}
