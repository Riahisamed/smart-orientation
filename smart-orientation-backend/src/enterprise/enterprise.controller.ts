import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { EnterpriseService } from './enterprise.service';
import { Public } from '../auth/public.decorator';

@Controller('enterprise')
export class EnterpriseController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  @Public()
  @Post('register')
  register(
    @Body()
    body: {
      email: string;
      password: string;
      name: string;
      description?: string;
      sector?: string;
      location?: string;
      website?: string;
      contactEmail?: string;
      contactPhone?: string;
    },
  ) {
    return this.enterpriseService.register(body);
  }

  @Get('profile')
  getProfile(@Request() req) {
    return this.enterpriseService.getProfile(req.user.userId);
  }

  @Put('profile')
  updateProfile(@Request() req, @Body() body: any) {
    return this.enterpriseService.updateProfile(req.user.userId, body);
  }

  @Get('offers')
  getJobOffers(@Request() req) {
    return this.enterpriseService.getJobOffers(req.user.userId);
  }

  @Get('offers/:id')
  getJobOfferById(@Request() req, @Param('id') id: string) {
    return this.enterpriseService.getJobOfferById(req.user.userId, +id);
  }

  @Post('offers')
  createJobOffer(@Request() req, @Body() body: any) {
    return this.enterpriseService.createJobOffer(req.user.userId, body);
  }

  @Put('offers/:id')
  updateJobOffer(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.enterpriseService.updateJobOffer(req.user.userId, +id, body);
  }

  @Delete('offers/:id')
  deleteJobOffer(@Request() req, @Param('id') id: string) {
    return this.enterpriseService.deleteJobOffer(req.user.userId, +id);
  }

  @Get('offers/:id/compatible-students')
  getCompatibleStudents(@Request() req, @Param('id') id: string) {
    return this.enterpriseService.getCompatibleStudents(req.user.userId, +id);
  }

  @Get('statistics')
  getStudentStatistics(@Request() req) {
    return this.enterpriseService.getStudentStatistics(req.user.userId);
  }
}