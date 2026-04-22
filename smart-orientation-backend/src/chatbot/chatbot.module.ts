import { Module } from '@nestjs/common'
import { ChatbotController } from './chatbot.controller'
import { ChatbotService } from './chatbot.service'
import { StudentModule } from '../student/student.module'
import { CommonModule } from '../common/common.module'

@Module({
  imports: [StudentModule, CommonModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}