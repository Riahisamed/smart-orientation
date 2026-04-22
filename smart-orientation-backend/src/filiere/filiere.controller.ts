import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { FiliereService } from './filiere.service';
import { Public } from '../common/decorators/public.decorator';
import { UseInterceptors, UploadedFile } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Roles } from '../auth/roles.decorator';
@Controller('filiere')
export class FiliereController {

  constructor(private filiereService: FiliereService) {}

  // إنشاء شعبة (للأدمن)
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
  @Post(':id/bac')
  addBacInfo(
    @Param('id') id: string,
    @Body() body: any
  ) {
    return this.filiereService.addBacInfo(+id, body);
  }
  @Post('upload-guide')
async uploadGuide(@Body() data: any[]) {
  return this.filiereService.importGuide(data)
}
@Roles('ADMIN')
@Post('upload-pdf')
@UseInterceptors(FileInterceptor('file'))
async uploadPdf(@UploadedFile() file: Express.Multer.File) {
  return this.filiereService.processPdf(file)
}
}