import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrientationTestController } from './orientation-test.controller';
import { OrientationTestService } from './orientation-test.service';

@Module({
  imports: [PrismaModule],
  controllers: [OrientationTestController],
  providers: [OrientationTestService],
  exports: [OrientationTestService],
})
export class OrientationTestModule {}
