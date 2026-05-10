import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { OrientationTestService } from './orientation-test.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('orientation-test')
@UseGuards(JwtAuthGuard)
export class OrientationTestController {
  constructor(
    private readonly orientationTestService: OrientationTestService,
  ) {}

  @Get('questions')
  @Public()
  questions() {
    return this.orientationTestService.questions();
  }

  @Post('submit')
  submit(@Req() req, @Body() body: any) {
    return this.orientationTestService.submit(req.user.userId, body);
  }

  @Get('me/latest')
  latest(@Req() req) {
    return this.orientationTestService.latest(req.user.userId);
  }

  @Get('me/history')
  history(@Req() req) {
    return this.orientationTestService.history(req.user.userId);
  }
}
