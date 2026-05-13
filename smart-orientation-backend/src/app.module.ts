import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { StudentModule } from './student/student.module';
import { AuthModule } from './auth/auth.module';
import { SkillModule } from './skill/skill.module';
import { FiliereModule } from './filiere/filiere.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { CommonModule } from './common/common.module';
import { OrientationTestModule } from './orientation-test/orientation-test.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';

import { JwtAuthGuard } from './auth/jwt/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { EnterpriseModule } from './enterprise/enterprise.module';
import { MarketTrendsModule } from './market-trends/market-trends.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    PrismaModule,
    StudentModule,
    AuthModule,
    SkillModule,
    FiliereModule,
    ChatbotModule,
    OrientationTestModule,
    ReportsModule,
    NotificationsModule,
    AdminModule,
    EnterpriseModule,
    MarketTrendsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
