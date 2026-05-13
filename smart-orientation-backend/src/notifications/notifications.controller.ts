import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  mine(@Req() req) {
    return this.notificationsService.mine(req.user.userId);
  }

  @Get('unread-count')
  unreadCount(@Req() req) {
    return this.notificationsService.unreadCount(req.user.userId);
  }

  @Get('type/:type')
  getByType(@Req() req, @Param('type') type: string) {
    return this.notificationsService.getByType(req.user.userId, type);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() req) {
    return this.notificationsService.markRead(+id, req.user.userId);
  }

  @Patch('read-all')
  markAllRead(@Req() req) {
    return this.notificationsService.markAllRead(req.user.userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req) {
    return this.notificationsService.delete(+id, req.user.userId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() body: any) {
    return this.notificationsService.create(body);
  }

  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  broadcast(@Body() body: any) {
    return this.notificationsService.broadcast(body);
  }
}