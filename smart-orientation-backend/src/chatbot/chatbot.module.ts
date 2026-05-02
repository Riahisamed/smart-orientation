import { Module } from '@nestjs/common'
import { ChatbotController } from './chatbot.controller'
import { ChatbotService } from './chatbot.service'
import { AiService } from './ai.service'
import { IntentDetectorService } from './intent-detector.service'
import { RagService } from './rag.service'
import { ResponseBuilderService } from './response-builder.service'
import { SafetyRulesService } from './safety-rules.service'
import { StudentModule } from '../student/student.module'
import { CommonModule } from '../common/common.module'

@Module({
  imports: [StudentModule, CommonModule],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    AiService,
    IntentDetectorService,
    RagService,
    ResponseBuilderService,
    SafetyRulesService,
  ],
  exports: [
    ChatbotService,
    AiService,
    IntentDetectorService,
    RagService,
    ResponseBuilderService,
    SafetyRulesService,
  ],
})
export class ChatbotModule {}
