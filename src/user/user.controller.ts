import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('dashboard')
  async getDashboard(@Request() req) {
    return this.userService.getDashboard(req.user.id);
  }

  @Post('refresh-kyc')
  async refreshKycStatus(@Request() req) {
    return this.userService.refreshKycStatus(req.user.id);
  }
}
