import { Module } from '@nestjs/common';
import { FiliereController } from './filiere.controller';
import { FiliereService } from './filiere.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FiliereController],
  providers: [FiliereService],
  exports: [FiliereService], // 👈 زيد هذا
})
export class FiliereModule {}
