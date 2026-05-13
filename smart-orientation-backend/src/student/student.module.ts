import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FiliereModule } from '../filiere/filiere.module';
@Module({
  imports: [PrismaModule, FiliereModule], // 👈 زيد هذا
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService], // 👈 لازم تصدّر باش تستعملها في ChatbotModule
})
export class StudentModule {}
