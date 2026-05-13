import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  stats() {
    return this.adminService.stats();
  }

  @Get('analytics')
  getFullAnalytics() {
    return this.adminService.getFullAnalytics();
  }

  @Get('students')
  students() {
    return this.adminService.students();
  }

  @Get('students/search')
  searchStudents(
    @Query('q') query: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.adminService.searchStudents(
      query || '',
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
  }

  @Get('domains')
  domains() {
    return this.adminService.domains();
  }

  @Get('notifications')
  notifications() {
    return this.adminService.notifications();
  }

  @Get('enterprises')
  getEnterprises() {
    return this.adminService.getEnterprises();
  }

  @Get('job-offers')
  getJobOffers() {
    return this.adminService.getJobOffers();
  }
}