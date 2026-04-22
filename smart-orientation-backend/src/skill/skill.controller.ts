import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { SkillService } from './skill.service';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('skill')
export class SkillController {

  constructor(private skillService: SkillService) {}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Post()
create(@Body() body: any) {
  return this.skillService.create(body.name);
}
  @Get()
  findAll() {
    return this.skillService.findAll();
  }
}