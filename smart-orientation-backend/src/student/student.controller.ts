import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { StudentService } from './student.service';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../common/decorators/public.decorator';
import { Req, UseGuards } from '@nestjs/common';
import { FiliereService } from '../filiere/filiere.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
@Controller('student')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly filiereService: FiliereService, // 👈 زيد هذا
  ) {}

  /////////////////////////////
  // جلب الطلبة (محمي)
  /////////////////////////////

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.studentService.findAll();
  }

  /////////////////////////////
  // إنشاء طالب
  /////////////////////////////

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() body: any, @Req() req) {
    return this.studentService.create(body, req.user.userId);
  }

  /////////////////////////////
  // FG principale (بدون حماية)
  /////////////////////////////
  /////////////////////////////
  // FG principale
  /////////////////////////////
  @Public()
  @Post('calculate-fg')
  calculateFG(@Body() body: any) {
    const FG = this.studentService.calculateFG(body);

    return { FG: Number(FG.toFixed(2)) };
  }

  @Public()
  @Post('calculate-fg-controle')
  calculateFGControle(@Body() body: any) {
    const math = this.studentService.calculateControlSubject(
      body.mathMain,
      body.mathControl,
    );

    const physics = this.studentService.calculateControlSubject(
      body.physicsMain,
      body.physicsControl,
    );

    const svt = this.studentService.calculateControlSubject(
      body.svtMain,
      body.svtControl,
    );

    const bacAverage = this.studentService.calculateControlAverage(
      body.mgMain,
      body.mgControl,
    );

    const FG = this.studentService.calculateFG({
      ...body,
      math,
      physics,
      svt,
      bacAverage,
    });

    return { FG: Number(FG.toFixed(2)) };
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('update')
  update(@Req() req, @Body() body: any) {
    return this.studentService.update(req.user.userId, body);
  }
  /////////////////////////////
  // Orientation (محمي)
  /////////////////////////////
  @Public()
  @Get('me/orientation')
  async orientation() {
    return this.filiereService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyStudent(@Req() req) {
    return this.studentService.getByUser(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(+id);
  }
  @Public()
  @Post('calculate-t')
  calculateT(@Body() body: any) {
    const T = this.studentService.calculateT(body.student, body.formula);

    return { T };
  }
}
