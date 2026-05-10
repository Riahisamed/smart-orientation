import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { FiliereService } from './filiere.service';
import { Public } from '../common/decorators/public.decorator';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
@Controller('filiere')
export class FiliereController {
  constructor(private filiereService: FiliereService) {}

  // إنشاء شعبة (للأدمن)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() body: any) {
    return this.filiereService.create(body);
  }

  // جلب كل الشعب
  @Public()
  @Get()
  findAll() {
    return this.filiereService.findAll();
  }

  // جلب شعبة واحدة

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filiereService.findOne(+id);
  }

  // إضافة معلومات الباك لشعبة
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/bac')
  addBacInfo(@Param('id') id: string, @Body() body: any) {
    return this.filiereService.addBacInfo(+id, body);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('upload-guide')
  async uploadGuide(@Body() data: any[]) {
    return this.filiereService.importGuide(data);
  }
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('upload-pdf')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    return this.filiereService.processPdf(file);
  }
}
